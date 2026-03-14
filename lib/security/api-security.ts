/**
 * API Security Wrapper
 * Applies comprehensive security measures to API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { SecurityMiddleware } from './middleware';
import { logger } from './secure-logger';
import { AuditLogger } from './audit-logger';

export interface SecurityOptions {
  requireAuth?: boolean;
  rateLimit?: 'low' | 'medium' | 'high';
  permissions?: string[];
  logRequests?: boolean;
}

/**
 * Secure API wrapper that applies all security measures
 */
export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: SecurityOptions = {}
) {
  return async function securedHandler(req: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();
    const ip = SecurityMiddleware.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    try {
      // Perform comprehensive security check
      const securityCheck = await SecurityMiddleware.performSecurityCheck(
        req,
        options.requireAuth ? 'authenticated' : 'anonymous'
      );
      
      if (!securityCheck.allowed) {
        // Log security violation
        await AuditLogger.logSecurityEvent({
          type: 'security_violation',
          severity: 'high',
          details: {
            reason: securityCheck.reason,
            path: req.nextUrl.pathname,
            method: req.method,
          },
          ipAddress: ip,
          userAgent,
        });
        
        const response = NextResponse.json(
          { error: 'Access denied' },
          { status: securityCheck.reason?.includes('rate limit') ? 429 : 403 }
        );
        
        return SecurityMiddleware.applySecurityHeaders(response);
      }
      
      // Log API request if enabled
      if (options.logRequests) {
        logger.apiRequest(
          req.method,
          req.nextUrl.pathname,
          undefined, // userId would come from auth
          undefined  // duration calculated later
        );
      }
      
      // Execute the actual handler
      const response = await handler(req);
      
      // Apply security headers
      const securedResponse = SecurityMiddleware.applySecurityHeaders(response);
      
      // Log successful request
      const duration = Date.now() - startTime;
      if (options.logRequests) {
        logger.performance(
          `${req.method} ${req.nextUrl.pathname}`,
          duration
        );
      }
      
      return securedResponse;
      
    } catch (error) {
      // Log error
      logger.error(
        `API error in ${req.method} ${req.nextUrl.pathname}`,
        error instanceof Error ? error : new Error(String(error)),
        { ip, userAgent }
      );
      
      // Return generic error response
      const response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      
      return SecurityMiddleware.applySecurityHeaders(response);
    }
  };
}

/**
 * Authentication middleware
 */
export function requireAuth(
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  return withSecurity(async (req: NextRequest) => {
    // Extract user ID from session/token
    // This is a simplified version - implement proper auth extraction
    const authHeader = req.headers.get('authorization');
    const sessionCookie = req.cookies.get('session');
    
    if (!authHeader && !sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Extract userId from auth (simplified)
    const userId = 'extracted-user-id'; // Implement proper extraction
    
    return handler(req, userId);
  }, { requireAuth: true, logRequests: true });
}

/**
 * Admin-only middleware
 */
export function requireAdmin(
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  return requireAuth(async (req: NextRequest, userId: string) => {
    // Check if user is admin (simplified)
    const isAdmin = true; // Implement proper admin check
    
    if (!isAdmin) {
      await AuditLogger.logSecurityEvent({
        type: 'unauthorized_admin_access',
        severity: 'high',
        details: {
          path: req.nextUrl.pathname,
          method: req.method,
        },
        userId,
        ipAddress: SecurityMiddleware.getClientIP(req),
        userAgent: req.headers.get('user-agent') || 'unknown',
      });
      
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return handler(req, userId);
  });
}

/**
 * Rate limited endpoint
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  limit: 'low' | 'medium' | 'high' = 'medium'
) {
  return withSecurity(handler, { rateLimit: limit, logRequests: true });
}

/**
 * Public endpoint with basic security
 */
export function publicEndpoint(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withSecurity(handler, { logRequests: false });
}