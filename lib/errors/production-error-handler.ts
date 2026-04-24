/**
 * Production Error Handler
 *
 * Standardized error handling for production deployment with
 * proper logging, monitoring, and user-friendly responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/security/secure-logger";
import { auditLogger } from "@/lib/security/enhanced-audit-logger";
import { nanoid } from "nanoid";

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  requestId?: string;
}

export interface AppError extends Error {
  code: string;
  statusCode: number;
  isOperational: boolean;
  context?: ErrorContext;
  originalError?: Error;
}

export class ProductionError extends Error implements AppError {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: ErrorContext;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: ErrorContext,
    originalError?: Error,
  ) {
    super(message);
    this.name = "ProductionError";
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.originalError = originalError;

    // Capture stack trace
    Error.captureStackTrace(this, ProductionError);
  }
}

// Predefined error types
export class ValidationError extends ProductionError {
  constructor(message: string, context?: ErrorContext) {
    super(message, "VALIDATION_ERROR", 400, true, context);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends ProductionError {
  constructor(
    message: string = "Authentication required",
    context?: ErrorContext,
  ) {
    super(message, "AUTHENTICATION_ERROR", 401, true, context);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends ProductionError {
  constructor(
    message: string = "Insufficient permissions",
    context?: ErrorContext,
  ) {
    super(message, "AUTHORIZATION_ERROR", 403, true, context);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends ProductionError {
  constructor(message: string = "Resource not found", context?: ErrorContext) {
    super(message, "NOT_FOUND_ERROR", 404, true, context);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends ProductionError {
  constructor(message: string = "Rate limit exceeded", context?: ErrorContext) {
    super(message, "RATE_LIMIT_ERROR", 429, true, context);
    this.name = "RateLimitError";
  }
}

export class ExternalServiceError extends ProductionError {
  constructor(
    service: string,
    message: string,
    context?: ErrorContext,
    originalError?: Error,
  ) {
    super(
      `${service} service error: ${message}`,
      "EXTERNAL_SERVICE_ERROR",
      502,
      true,
      context,
      originalError,
    );
    this.name = "ExternalServiceError";
  }
}

export class DatabaseError extends ProductionError {
  constructor(message: string, context?: ErrorContext, originalError?: Error) {
    super(
      `Database error: ${message}`,
      "DATABASE_ERROR",
      500,
      false,
      context,
      originalError,
    );
    this.name = "DatabaseError";
  }
}

export class ComplianceError extends ProductionError {
  constructor(message: string, context?: ErrorContext) {
    super(
      `Compliance violation: ${message}`,
      "COMPLIANCE_ERROR",
      400,
      true,
      context,
    );
    this.name = "ComplianceError";
  }
}

export class ProductionErrorHandler {
  private static readonly SENSITIVE_FIELDS = [
    "password",
    "token",
    "secret",
    "key",
    "nin",
    "ssn",
    "credit_card",
  ];

  /**
   * Handle API route errors
   */
  static async handleAPIError(
    error: Error,
    request: NextRequest,
    context?: Partial<ErrorContext>,
  ): Promise<NextResponse> {
    const requestId = nanoid();
    const errorContext: ErrorContext = {
      requestId,
      endpoint: request.nextUrl.pathname,
      method: request.method,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get("user-agent") || undefined,
      ...context,
    };

    // Convert to AppError if needed
    const appError = this.normalizeError(error, errorContext);

    // Log the error
    await this.logError(appError);

    // Send audit event
    await auditLogger.logSystemError(
      appError,
      `API Error: ${errorContext.endpoint}`,
      this.getSeverityFromStatusCode(appError.statusCode),
      errorContext.userId,
      errorContext.sessionId,
    );

    // Return appropriate response
    return this.createErrorResponse(appError, requestId);
  }

  /**
   * Handle page errors
   */
  static async handlePageError(
    error: Error,
    context?: Partial<ErrorContext>,
  ): Promise<void> {
    const requestId = nanoid();
    const errorContext: ErrorContext = {
      requestId,
      ...context,
    };

    const appError = this.normalizeError(error, errorContext);
    await this.logError(appError);

    await auditLogger.logSystemError(
      appError,
      "Page Error",
      this.getSeverityFromStatusCode(appError.statusCode),
      errorContext.userId,
      errorContext.sessionId,
    );
  }

  /**
   * Normalize any error to AppError
   */
  private static normalizeError(error: Error, context: ErrorContext): AppError {
    if (error instanceof ProductionError) {
      return { ...error, context: { ...error.context, ...context } };
    }

    // Handle specific error types
    if (error.message.includes("validation")) {
      return new ValidationError(error.message, context);
    }

    if (
      error.message.includes("unauthorized") ||
      error.message.includes("authentication")
    ) {
      return new AuthenticationError(error.message, context);
    }

    if (
      error.message.includes("forbidden") ||
      error.message.includes("permission")
    ) {
      return new AuthorizationError(error.message, context);
    }

    if (error.message.includes("not found")) {
      return new NotFoundError(error.message, context);
    }

    if (error.message.includes("rate limit")) {
      return new RateLimitError(error.message, context);
    }

    // Database errors
    if (
      error.message.includes("database") ||
      error.message.includes("connection")
    ) {
      return new DatabaseError(error.message, context, error);
    }

    // Default to internal server error
    return new ProductionError(
      "An unexpected error occurred",
      "INTERNAL_SERVER_ERROR",
      500,
      false,
      context,
      error,
    );
  }

  /**
   * Log error with appropriate level
   */
  private static async logError(error: AppError): Promise<void> {
    const logData = {
      requestId: error.context?.requestId,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      endpoint: error.context?.endpoint,
      method: error.context?.method,
      userId: error.context?.userId,
      sessionId: error.context?.sessionId,
      ipAddress: error.context?.ipAddress,
      stack: error.stack,
      originalError: error.originalError?.message,
    };

    // Remove sensitive data
    const sanitizedLogData = this.sanitizeLogData(logData);

    if (error.statusCode >= 500) {
      logger.error("Server Error", sanitizedLogData);
    } else if (error.statusCode >= 400) {
      logger.warn("Client Error", sanitizedLogData);
    } else {
      logger.info("Error Handled", sanitizedLogData);
    }
  }

  /**
   * Create error response
   */
  private static createErrorResponse(
    error: AppError,
    requestId: string,
  ): NextResponse {
    const isDevelopment = process.env.NODE_ENV === "development";

    // Base response
    const response: any = {
      success: false,
      error: {
        code: error.code,
        message: this.getUserFriendlyMessage(error),
        requestId,
      },
    };

    // Add debug info in development
    if (isDevelopment) {
      response.error.debug = {
        originalMessage: error.message,
        stack: error.stack,
        context: error.context,
      };
    }

    // Add specific error details based on type
    if (error instanceof ValidationError) {
      response.error.type = "validation";
      response.error.details = this.extractValidationDetails(error);
    } else if (error instanceof RateLimitError) {
      response.error.type = "rate_limit";
      response.error.retryAfter = 60; // seconds
    } else if (error instanceof ExternalServiceError) {
      response.error.type = "service_unavailable";
      response.error.message = "External service temporarily unavailable";
    }

    return NextResponse.json(response, {
      status: error.statusCode,
      headers: {
        "X-Request-ID": requestId,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Get user-friendly error message
   */
  private static getUserFriendlyMessage(error: AppError): string {
    const friendlyMessages: Record<string, string> = {
      VALIDATION_ERROR: "Please check your input and try again.",
      AUTHENTICATION_ERROR: "Please log in to continue.",
      AUTHORIZATION_ERROR: "You do not have permission to perform this action.",
      NOT_FOUND_ERROR: "The requested resource was not found.",
      RATE_LIMIT_ERROR: "Too many requests. Please try again later.",
      EXTERNAL_SERVICE_ERROR:
        "Service temporarily unavailable. Please try again later.",
      DATABASE_ERROR: "A system error occurred. Please try again later.",
      COMPLIANCE_ERROR: "This action violates our data protection policies.",
      INTERNAL_SERVER_ERROR:
        "An unexpected error occurred. Please try again later.",
    };

    return friendlyMessages[error.code] || error.message;
  }

  /**
   * Extract validation details from error
   */
  private static extractValidationDetails(error: ValidationError): any {
    // This would parse validation error details
    // For now, return basic structure
    return {
      fields: [],
      message: error.message,
    };
  }

  /**
   * Get client IP address
   */
  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");

    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    return realIP || "unknown";
  }

  /**
   * Get severity from status code
   */
  private static getSeverityFromStatusCode(
    statusCode: number,
  ): "low" | "medium" | "high" | "critical" {
    if (statusCode >= 500) return "high";
    if (statusCode >= 400) return "medium";
    return "low";
  }

  /**
   * Sanitize log data to remove sensitive information
   */
  private static sanitizeLogData(data: any): any {
    const sanitized = { ...data };

    for (const field of this.SENSITIVE_FIELDS) {
      if (sanitized[field]) {
        sanitized[field] = "[REDACTED]";
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeLogData(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Create error boundary for React components
   */
  static createErrorBoundary() {
    return class ErrorBoundary extends Error {
      constructor(error: Error, errorInfo: any) {
        super(error.message);
        this.name = "ErrorBoundary";

        // Log the error
        ProductionErrorHandler.handlePageError(error, {
          endpoint: "client_component",
          method: "render",
        });
      }
    };
  }
}

// Utility functions for common error scenarios
export const createValidationError = (
  message: string,
  context?: ErrorContext,
) => new ValidationError(message, context);

export const createAuthError = (message?: string, context?: ErrorContext) =>
  new AuthenticationError(message, context);

export const createNotFoundError = (resource: string, context?: ErrorContext) =>
  new NotFoundError(`${resource} not found`, context);

export const createRateLimitError = (context?: ErrorContext) =>
  new RateLimitError(undefined, context);

export const createExternalServiceError = (
  service: string,
  message: string,
  context?: ErrorContext,
  originalError?: Error,
) => new ExternalServiceError(service, message, context, originalError);

// Export the main handler
export { ProductionErrorHandler as ErrorHandler };
