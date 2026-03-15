/**
 * Enterprise Security Configuration
 * Based on OWASP, PCI DSS, and industry best practices
 */

export const SECURITY_CONFIG = {
  // Authentication & Session Management
  AUTH: {
    JWT_EXPIRY: "15m", // Short-lived access tokens
    REFRESH_TOKEN_EXPIRY: "7d",
    MAX_LOGIN_ATTEMPTS: 3,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
    PASSWORD_MIN_LENGTH: 12,
    PASSWORD_COMPLEXITY: {
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      minUniqueChars: 8,
    },
    MFA_REQUIRED_FOR_ADMIN: true,
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  },

  // Rate Limiting (DDoS Protection)
  RATE_LIMITS: {
    LOGIN: { requests: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 min
    API_GENERAL: { requests: 100, window: 60 * 1000 }, // 100 req/min
    API_SENSITIVE: { requests: 10, window: 60 * 1000 }, // 10 req/min for payments
    REGISTRATION: { requests: 3, window: 60 * 60 * 1000 }, // 3 per hour
    PASSWORD_RESET: { requests: 3, window: 60 * 60 * 1000 },
  },

  // Data Protection
  ENCRYPTION: {
    ALGORITHM: "aes-256-gcm",
    KEY_ROTATION_DAYS: 90,
    SALT_ROUNDS: 12, // bcrypt rounds
    PII_FIELDS: ["email", "phone", "fullName", "nin"],
    SENSITIVE_FIELDS: ["passwordHash", "paymentReference"],
  },

  // Input Validation
  VALIDATION: {
    MAX_REQUEST_SIZE: "10mb",
    MAX_FILE_SIZE: "5mb",
    ALLOWED_FILE_TYPES: ["image/jpeg", "image/png", "application/pdf"],
    SQL_INJECTION_PATTERNS: [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(--|\/\*|\*\/|;|'|"|`)/,
      /(\bOR\b|\bAND\b).*?[=<>]/i,
    ],
    XSS_PATTERNS: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /<link/gi,
      /<meta/gi,
      /<svg\b[^>]*>/gi,
      /<img\b[^>]*>/gi,
    ],
  },

  // Security Headers
  HEADERS: {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.paystack.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.paystack.co",
      "frame-src https://checkout.paystack.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },

  // Audit & Monitoring
  AUDIT: {
    LOG_SENSITIVE_OPERATIONS: true,
    LOG_FAILED_ATTEMPTS: true,
    LOG_ADMIN_ACTIONS: true,
    RETENTION_DAYS: 365,
    ALERT_THRESHOLDS: {
      FAILED_LOGINS: 10,
      SUSPICIOUS_PATTERNS: 5,
      HIGH_VALUE_TRANSACTIONS: 100000, // ₦1,000 in kobo
    },
  },

  // PCI DSS Compliance
  PCI_DSS: {
    MASK_PAN: true, // Mask Primary Account Numbers
    LOG_ACCESS_TO_CHD: true, // Cardholder Data
    ENCRYPT_TRANSMISSION: true,
    RESTRICT_ACCESS_BY_BUSINESS_NEED: true,
    ASSIGN_UNIQUE_ID: true,
    REGULARLY_TEST_SECURITY: true,
  },
} as const;

// Environment-specific overrides
export const getSecurityConfig = () => {
  const env = process.env.NODE_ENV;

  if (env === "development") {
    return {
      ...SECURITY_CONFIG,
      AUTH: {
        ...SECURITY_CONFIG.AUTH,
        JWT_EXPIRY: "1h", // Longer for dev convenience
      },
      RATE_LIMITS: {
        ...SECURITY_CONFIG.RATE_LIMITS,
        API_GENERAL: { requests: 1000, window: 60 * 1000 }, // More lenient for dev
      },
    };
  }

  return SECURITY_CONFIG;
};
