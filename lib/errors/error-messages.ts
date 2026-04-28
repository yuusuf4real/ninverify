/**
 * User-Friendly Error Messages
 *
 * Centralized error message management with professional,
 * helpful messages similar to Stripe, Vercel, and other modern platforms.
 */

export interface ErrorDetails {
  title: string;
  message: string;
  action?: string;
  helpText?: string;
  supportLink?: string;
}

/**
 * Error categories for better organization
 */
export enum ErrorCategory {
  NETWORK = "NETWORK",
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  PAYMENT = "PAYMENT",
  VERIFICATION = "VERIFICATION",
  SERVER = "SERVER",
  NOT_FOUND = "NOT_FOUND",
  RATE_LIMIT = "RATE_LIMIT",
  UNKNOWN = "UNKNOWN",
}

/**
 * User-friendly error messages mapped by error code/type
 */
export const ERROR_MESSAGES: Record<string, ErrorDetails> = {
  // Network Errors
  NETWORK_ERROR: {
    title: "Connection Problem",
    message:
      "We're having trouble connecting to our servers. Please check your internet connection and try again.",
    action: "Check your connection",
    helpText:
      "Make sure you're connected to the internet and try refreshing the page.",
  },
  TIMEOUT_ERROR: {
    title: "Request Timed Out",
    message:
      "The request took too long to complete. This might be due to a slow connection or high server load.",
    action: "Try again",
    helpText: "If this persists, please wait a few minutes and try again.",
  },

  // Validation Errors
  INVALID_PHONE: {
    title: "Invalid Phone Number",
    message:
      "Please enter a valid Nigerian phone number (e.g., 0803 123 4567).",
    action: "Check your number",
    helpText: "Nigerian numbers start with 070, 080, 081, 090, or 091.",
  },
  INVALID_NIN: {
    title: "Invalid NIN Format",
    message: "Please enter a valid 11-digit National Identification Number.",
    action: "Check your NIN",
    helpText: "Your NIN should be exactly 11 digits without spaces or dashes.",
  },
  INVALID_OTP: {
    title: "Invalid Verification Code",
    message: "The code you entered is incorrect. Please check and try again.",
    action: "Re-enter code",
    helpText: "Make sure you're entering the 6-digit code sent to your phone.",
  },
  OTP_EXPIRED: {
    title: "Code Expired",
    message: "Your verification code has expired. Please request a new one.",
    action: "Request new code",
    helpText: "Verification codes expire after 10 minutes for security.",
  },

  // Authentication Errors
  UNAUTHORIZED: {
    title: "Authentication Required",
    message: "You need to be signed in to access this page.",
    action: "Sign in",
    helpText: "Please sign in to continue with your verification.",
  },
  SESSION_EXPIRED: {
    title: "Session Expired",
    message:
      "Your session has expired for security reasons. Please start a new verification.",
    action: "Start over",
    helpText: "Sessions expire after 30 minutes of inactivity.",
  },
  INVALID_TOKEN: {
    title: "Invalid Session",
    message: "Your session token is invalid or has been tampered with.",
    action: "Start new verification",
    helpText: "For security, please start a new verification process.",
  },

  // Authorization Errors
  FORBIDDEN: {
    title: "Access Denied",
    message: "You don't have permission to access this resource.",
    action: "Go back",
    helpText: "If you believe this is an error, please contact support.",
  },
  ADMIN_ONLY: {
    title: "Admin Access Required",
    message: "This page is only accessible to administrators.",
    action: "Return to homepage",
    helpText: "Contact your administrator if you need access.",
  },

  // Payment Errors
  PAYMENT_FAILED: {
    title: "Payment Failed",
    message:
      "We couldn't process your payment. Please try again or use a different payment method.",
    action: "Try again",
    helpText:
      "Check that your card details are correct and you have sufficient funds.",
  },
  INSUFFICIENT_FUNDS: {
    title: "Insufficient Funds",
    message: "Your payment was declined due to insufficient funds.",
    action: "Try another card",
    helpText:
      "Please use a different payment method or add funds to your account.",
  },
  PAYMENT_CANCELLED: {
    title: "Payment Cancelled",
    message: "You cancelled the payment process.",
    action: "Try again",
    helpText: "You can restart the verification process when you're ready.",
  },

  // Verification Errors
  NIN_NOT_FOUND: {
    title: "NIN Not Found",
    message:
      "We couldn't find any records matching this NIN in the NIMC database.",
    action: "Check your NIN",
    helpText:
      "Please verify your NIN is correct. If the problem persists, contact NIMC.",
  },
  VERIFICATION_FAILED: {
    title: "Verification Failed",
    message: "We couldn't complete your NIN verification at this time.",
    action: "Try again",
    helpText:
      "This might be a temporary issue. Please try again in a few minutes.",
  },
  NIMC_SERVICE_DOWN: {
    title: "NIMC Service Unavailable",
    message: "The NIMC verification service is temporarily unavailable.",
    action: "Try later",
    helpText:
      "We're working to restore the service. Please try again in 15-30 minutes.",
  },

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: {
    title: "Too Many Attempts",
    message:
      "You've made too many requests. Please wait a few minutes before trying again.",
    action: "Wait and retry",
    helpText: "This is a security measure to protect your account.",
  },
  OTP_LIMIT_EXCEEDED: {
    title: "Too Many OTP Requests",
    message:
      "You've requested too many verification codes. Please wait before requesting another.",
    action: "Wait 10 minutes",
    helpText: "You can request a new code after the cooldown period.",
  },

  // Server Errors
  SERVER_ERROR: {
    title: "Server Error",
    message:
      "Something went wrong on our end. Our team has been notified and is working on it.",
    action: "Try again",
    helpText:
      "If this persists, please contact support with the error ID below.",
  },
  DATABASE_ERROR: {
    title: "Database Error",
    message:
      "We're experiencing database issues. Please try again in a few moments.",
    action: "Retry",
    helpText: "Your data is safe. This is a temporary issue.",
  },
  SERVICE_UNAVAILABLE: {
    title: "Service Temporarily Unavailable",
    message:
      "Our service is temporarily down for maintenance or experiencing high load.",
    action: "Check status",
    helpText: "We'll be back shortly. Check our status page for updates.",
    supportLink: "/status",
  },

  // Not Found
  NOT_FOUND: {
    title: "Page Not Found",
    message: "The page you're looking for doesn't exist or has been moved.",
    action: "Go to homepage",
    helpText: "Check the URL or use the navigation to find what you need.",
  },
  RESOURCE_NOT_FOUND: {
    title: "Resource Not Found",
    message: "The resource you're trying to access doesn't exist.",
    action: "Go back",
    helpText: "It may have been deleted or the link might be incorrect.",
  },

  // Unknown/Default
  UNKNOWN_ERROR: {
    title: "Something Went Wrong",
    message: "An unexpected error occurred. We're looking into it.",
    action: "Try again",
    helpText: "If this keeps happening, please contact our support team.",
  },
};

/**
 * Get user-friendly error details from error code or message
 */
export function getErrorDetails(
  errorCode?: string,
  errorMessage?: string,
  category?: ErrorCategory,
): ErrorDetails {
  // Try to match by error code first
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }

  // Try to match by error message patterns
  if (errorMessage) {
    const message = errorMessage.toLowerCase();

    // Network errors
    if (message.includes("network") || message.includes("fetch")) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (message.includes("timeout")) {
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    }

    // Validation errors
    if (message.includes("phone")) {
      return ERROR_MESSAGES.INVALID_PHONE;
    }
    if (message.includes("nin")) {
      return ERROR_MESSAGES.INVALID_NIN;
    }
    if (message.includes("otp") || message.includes("code")) {
      return ERROR_MESSAGES.INVALID_OTP;
    }

    // Auth errors
    if (message.includes("unauthorized") || message.includes("401")) {
      return ERROR_MESSAGES.UNAUTHORIZED;
    }
    if (message.includes("forbidden") || message.includes("403")) {
      return ERROR_MESSAGES.FORBIDDEN;
    }
    if (message.includes("session") || message.includes("expired")) {
      return ERROR_MESSAGES.SESSION_EXPIRED;
    }

    // Payment errors
    if (message.includes("payment")) {
      return ERROR_MESSAGES.PAYMENT_FAILED;
    }

    // Server errors
    if (message.includes("500") || message.includes("server")) {
      return ERROR_MESSAGES.SERVER_ERROR;
    }
    if (message.includes("503") || message.includes("unavailable")) {
      return ERROR_MESSAGES.SERVICE_UNAVAILABLE;
    }

    // Not found
    if (message.includes("404") || message.includes("not found")) {
      return ERROR_MESSAGES.NOT_FOUND;
    }

    // Rate limiting
    if (message.includes("rate limit") || message.includes("too many")) {
      return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
    }
  }

  // Try to match by category
  if (category) {
    switch (category) {
      case ErrorCategory.NETWORK:
        return ERROR_MESSAGES.NETWORK_ERROR;
      case ErrorCategory.VALIDATION:
        return ERROR_MESSAGES.UNKNOWN_ERROR;
      case ErrorCategory.AUTHENTICATION:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case ErrorCategory.AUTHORIZATION:
        return ERROR_MESSAGES.FORBIDDEN;
      case ErrorCategory.PAYMENT:
        return ERROR_MESSAGES.PAYMENT_FAILED;
      case ErrorCategory.VERIFICATION:
        return ERROR_MESSAGES.VERIFICATION_FAILED;
      case ErrorCategory.SERVER:
        return ERROR_MESSAGES.SERVER_ERROR;
      case ErrorCategory.NOT_FOUND:
        return ERROR_MESSAGES.NOT_FOUND;
      case ErrorCategory.RATE_LIMIT:
        return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
    }
  }

  // Default fallback
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Format error for display to user
 */
export function formatErrorForUser(error: unknown): ErrorDetails {
  if (error instanceof Error) {
    return getErrorDetails(undefined, error.message);
  }

  if (typeof error === "string") {
    return getErrorDetails(undefined, error);
  }

  if (typeof error === "object" && error !== null) {
    const err = error as any;
    return getErrorDetails(err.code, err.message, err.category);
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("NetworkError") ||
      error.name === "NetworkError"
    );
  }
  return false;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("validation") ||
      error.message.includes("invalid") ||
      error.message.includes("required")
    );
  }
  return false;
}

/**
 * Get HTTP status code from error
 */
export function getErrorStatusCode(error: unknown): number {
  if (typeof error === "object" && error !== null) {
    const err = error as any;
    if (err.status) return err.status;
    if (err.statusCode) return err.statusCode;
  }
  return 500;
}
