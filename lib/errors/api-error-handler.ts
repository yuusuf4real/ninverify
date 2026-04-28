/**
 * API Error Handler
 *
 * Utilities for handling and formatting API errors consistently
 */

import { NextResponse } from "next/server";
import { getErrorDetails, ErrorCategory } from "./error-messages";

/**
 * Custom API Error class
 */
export class APIError extends Error {
  statusCode: number;
  code: string;
  category: ErrorCategory;
  details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "UNKNOWN_ERROR",
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    details?: any,
  ) {
    super(message);
    this.name = "APIError";
    this.statusCode = statusCode;
    this.code = code;
    this.category = category;
    this.details = details;
  }
}

/**
 * Standard API error response format
 */
export interface APIErrorResponse {
  error: string;
  code: string;
  message: string;
  statusCode: number;
  timestamp: string;
  details?: any;
}

/**
 * Handle API errors and return formatted NextResponse
 */
export function handleAPIError(error: unknown): NextResponse<APIErrorResponse> {
  console.error("API Error:", error);

  // Handle custom APIError
  if (error instanceof APIError) {
    const errorDetails = getErrorDetails(
      error.code,
      error.message,
      error.category,
    );

    return NextResponse.json(
      {
        error: errorDetails.title,
        code: error.code,
        message: errorDetails.message,
        statusCode: error.statusCode,
        timestamp: new Date().toISOString(),
        details: error.details,
      },
      { status: error.statusCode },
    );
  }

  // Handle standard Error
  if (error instanceof Error) {
    const errorDetails = getErrorDetails(undefined, error.message);

    return NextResponse.json(
      {
        error: errorDetails.title,
        code: "UNKNOWN_ERROR",
        message: errorDetails.message,
        statusCode: 500,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      error: "Unknown Error",
      code: "UNKNOWN_ERROR",
      message: "An unexpected error occurred",
      statusCode: 500,
      timestamp: new Date().toISOString(),
    },
    { status: 500 },
  );
}

/**
 * Create validation error
 */
export function createValidationError(
  message: string,
  details?: any,
): APIError {
  return new APIError(
    message,
    400,
    "VALIDATION_ERROR",
    ErrorCategory.VALIDATION,
    details,
  );
}

/**
 * Create authentication error
 */
export function createAuthError(message: string = "Unauthorized"): APIError {
  return new APIError(
    message,
    401,
    "UNAUTHORIZED",
    ErrorCategory.AUTHENTICATION,
  );
}

/**
 * Create authorization error
 */
export function createForbiddenError(
  message: string = "Access denied",
): APIError {
  return new APIError(message, 403, "FORBIDDEN", ErrorCategory.AUTHORIZATION);
}

/**
 * Create not found error
 */
export function createNotFoundError(resource: string = "Resource"): APIError {
  return new APIError(
    `${resource} not found`,
    404,
    "NOT_FOUND",
    ErrorCategory.NOT_FOUND,
  );
}

/**
 * Create rate limit error
 */
export function createRateLimitError(
  message: string = "Too many requests",
): APIError {
  return new APIError(
    message,
    429,
    "RATE_LIMIT_EXCEEDED",
    ErrorCategory.RATE_LIMIT,
  );
}

/**
 * Create server error
 */
export function createServerError(
  message: string = "Internal server error",
  details?: any,
): APIError {
  return new APIError(
    message,
    500,
    "SERVER_ERROR",
    ErrorCategory.SERVER,
    details,
  );
}

/**
 * Create payment error
 */
export function createPaymentError(message: string, details?: any): APIError {
  return new APIError(
    message,
    402,
    "PAYMENT_FAILED",
    ErrorCategory.PAYMENT,
    details,
  );
}

/**
 * Create verification error
 */
export function createVerificationError(
  message: string,
  details?: any,
): APIError {
  return new APIError(
    message,
    400,
    "VERIFICATION_FAILED",
    ErrorCategory.VERIFICATION,
    details,
  );
}

/**
 * Validate request body
 */
export function validateRequestBody<T>(
  body: any,
  requiredFields: (keyof T)[],
): T {
  const missing = requiredFields.filter((field) => !body[field]);

  if (missing.length > 0) {
    throw createValidationError(
      `Missing required fields: ${missing.join(", ")}`,
      { missingFields: missing },
    );
  }

  return body as T;
}

/**
 * Safe async handler wrapper for API routes
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
) {
  return async (...args: T): Promise<R | NextResponse<APIErrorResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleAPIError(error);
    }
  };
}
