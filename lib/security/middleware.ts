/**
 * Enterprise Security Middleware
 * Implements rate limiting, request validation, and security headers
 */

import { NextRequest, NextResponse } from "next/server";
import { SECURITY_CONFIG } from "@/security/security-config";
import { validateApiRequest, generateRateLimitKey } from "./input-validation";
import { logSecurityEvent } from "./audit-logger";

// Rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export class SecurityMiddleware {
  /**
   * Apply security headers to response
   */
  static applySecurityHeaders(response: NextResponse): NextResponse {
    const headers = SECURITY_CONFIG.HEADERS;

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  /**
   * Rate limiting middleware
   */
  static async rateLimit(
    request: NextRequest,
    identifier: string,
    limitConfig: { requests: number; window: number },
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const ip = this.getClientIP(request);
    const key = generateRateLimitKey(identifier, request.nextUrl.pathname, ip);

    const now = Date.now();
    const windowStart = now - limitConfig.window;

    // Clean up old entries
    this.cleanupRateLimit(windowStart);

    const current = rateLimitStore.get(key) || {
      count: 0,
      resetTime: now + limitConfig.window,
    };

    if (now > current.resetTime) {
      // Reset window
      current.count = 0;
      current.resetTime = now + limitConfig.window;
    }

    current.count++;
    rateLimitStore.set(key, current);

    const allowed = current.count <= limitConfig.requests;
    const remaining = Math.max(0, limitConfig.requests - current.count);

    if (!allowed) {
      await logSecurityEvent("rate_limit_exceeded", {
        identifier,
        ip,
        path: request.nextUrl.pathname,
        count: current.count,
        limit: limitConfig.requests,
      });
    }

    return {
      allowed,
      remaining,
      resetTime: current.resetTime,
    };
  }

  /**
   * Clean up expired rate limit entries
   */
  private static cleanupRateLimit(cutoff: number): void {
    for (const [key, data] of rateLimitStore.entries()) {
      if (data.resetTime < cutoff) {
        rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Get client IP address
   */
  static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const remoteAddr = request.headers.get("remote-addr");

    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    return realIP || remoteAddr || "unknown";
  }

  /**
   * Validate request security
   */
  static validateRequest(request: NextRequest): {
    valid: boolean;
    errors: string[];
  } {
    return validateApiRequest({
      headers: Object.fromEntries(request.headers.entries()),
      // url: request.url, // Removed for type safety
      // method: request.method // Removed for type safety
    });
  }

  /**
   * CSRF protection
   */
  static validateCSRF(request: NextRequest): boolean {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");

    // For API requests, check origin
    if (request.nextUrl.pathname.startsWith("/api/")) {
      if (!origin) return false;

      try {
        const originUrl = new URL(origin);
        return originUrl.host === host;
      } catch {
        return false;
      }
    }

    // For form submissions, check referer
    if (request.method === "POST" && referer) {
      try {
        const refererUrl = new URL(referer);
        return refererUrl.host === host;
      } catch {
        return false;
      }
    }

    return true;
  }

  /**
   * Content type validation
   */
  static validateContentType(request: NextRequest): boolean {
    const contentType = request.headers.get("content-type");

    if (
      request.method === "POST" ||
      request.method === "PUT" ||
      request.method === "PATCH"
    ) {
      if (!contentType) return false;

      const allowedTypes = [
        "application/json",
        "application/x-www-form-urlencoded",
        "multipart/form-data",
      ];

      return allowedTypes.some((type) => contentType.includes(type));
    }

    return true;
  }

  /**
   * Bot detection
   */
  static detectBot(request: NextRequest): {
    isBot: boolean;
    confidence: number;
  } {
    const userAgent = request.headers.get("user-agent") || "";

    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /go-http-client/i,
    ];

    let confidence = 0;

    // Check user agent
    if (botPatterns.some((pattern) => pattern.test(userAgent))) {
      confidence += 0.7;
    }

    // Check for missing common headers
    const commonHeaders = ["accept", "accept-language", "accept-encoding"];
    const missingHeaders = commonHeaders.filter(
      (header) => !request.headers.get(header),
    );
    confidence += missingHeaders.length * 0.1;

    // Check for suspicious header combinations
    const hasJavaScript = request.headers.get("accept")?.includes("text/html");
    const hasUserAgent = userAgent.length > 0;

    if (!hasJavaScript && hasUserAgent) {
      confidence += 0.2;
    }

    return {
      isBot: confidence > 0.5,
      confidence: Math.min(confidence, 1),
    };
  }

  /**
   * Honeypot field validation
   */
  static validateHoneypot(formData: Record<string, unknown>): boolean {
    // Check for honeypot fields that should be empty
    const honeypotFields = ["website", "url", "homepage", "email_confirm"];

    for (const field of honeypotFields) {
      if (
        formData[field] &&
        typeof formData[field] === "string" &&
        (formData[field] as string).trim() !== ""
      ) {
        return false; // Bot detected
      }
    }

    return true;
  }

  /**
   * Request timing analysis
   */
  static analyzeRequestTiming(request: NextRequest): {
    suspicious: boolean;
    reason?: string;
  } {
    const timestamp = request.headers.get("x-timestamp");

    if (timestamp) {
      const requestTime = parseInt(timestamp);
      const now = Date.now();
      const timeDiff = Math.abs(now - requestTime);

      // Request too old or from future
      if (timeDiff > 300000) {
        // 5 minutes
        return { suspicious: true, reason: "Invalid timestamp" };
      }
    }

    return { suspicious: false };
  }

  /**
   * Comprehensive security check
   */
  static async performSecurityCheck(
    request: NextRequest,
    identifier?: string,
  ): Promise<{
    allowed: boolean;
    reason?: string;
    rateLimitInfo?: Record<string, unknown>;
  }> {
    // Basic request validation
    const requestValidation = this.validateRequest(request);
    if (!requestValidation.valid) {
      return {
        allowed: false,
        reason: `Invalid request: ${requestValidation.errors.join(", ")}`,
      };
    }

    // CSRF protection
    if (!this.validateCSRF(request)) {
      return {
        allowed: false,
        reason: "CSRF validation failed",
      };
    }

    // Content type validation
    if (!this.validateContentType(request)) {
      return {
        allowed: false,
        reason: "Invalid content type",
      };
    }

    // Bot detection
    const botDetection = this.detectBot(request);
    if (botDetection.isBot && botDetection.confidence > 0.8) {
      await logSecurityEvent("bot_detected", {
        userAgent: request.headers.get("user-agent"),
        ip: this.getClientIP(request),
        confidence: botDetection.confidence,
      });

      return {
        allowed: false,
        reason: "Automated request detected",
      };
    }

    // Rate limiting (if identifier provided)
    if (identifier) {
      const rateLimitResult = await this.rateLimit(
        request,
        identifier,
        SECURITY_CONFIG.RATE_LIMITS.API_GENERAL,
      );

      if (!rateLimitResult.allowed) {
        return {
          allowed: false,
          reason: "Rate limit exceeded",
          rateLimitInfo: rateLimitResult,
        };
      }
    }

    // Request timing analysis
    const timingAnalysis = this.analyzeRequestTiming(request);
    if (timingAnalysis.suspicious) {
      return {
        allowed: false,
        reason: timingAnalysis.reason,
      };
    }

    return { allowed: true };
  }
}

/**
 * Create security middleware for API routes
 */
export function createSecurityMiddleware(options: {
  requireAuth?: boolean;
  rateLimit?: keyof typeof SECURITY_CONFIG.RATE_LIMITS;
  permissions?: string[];
}) {
  return async function securityMiddleware(
    request: NextRequest,
    context: Record<string, unknown>,
    next: () => Promise<NextResponse>,
  ): Promise<NextResponse> {
    // Perform security checks
    const securityCheck = await SecurityMiddleware.performSecurityCheck(
      request,
      options.requireAuth ? "authenticated" : "anonymous",
    );

    if (!securityCheck.allowed) {
      const response = NextResponse.json(
        { error: securityCheck.reason },
        { status: securityCheck.reason?.includes("rate limit") ? 429 : 403 },
      );

      if (securityCheck.rateLimitInfo) {
        response.headers.set(
          "X-RateLimit-Remaining",
          ((securityCheck.rateLimitInfo as Record<string, unknown>)
            ?.remaining as string) || "0",
        );
        response.headers.set(
          "X-RateLimit-Reset",
          ((securityCheck.rateLimitInfo as Record<string, unknown>)
            ?.resetTime as string) || "0",
        );
      }

      return SecurityMiddleware.applySecurityHeaders(response);
    }

    // Authentication check
    if (options.requireAuth) {
      const authHeader = request.headers.get("authorization");
      const sessionCookie = request.cookies.get("session");

      if (!authHeader && !sessionCookie) {
        const response = NextResponse.json(
          { error: "Authentication required" },
          { status: 401 },
        );
        return SecurityMiddleware.applySecurityHeaders(response);
      }
    }

    // Continue to next middleware/handler
    const response = await next();

    // Apply security headers to response
    return SecurityMiddleware.applySecurityHeaders(response);
  };
}
