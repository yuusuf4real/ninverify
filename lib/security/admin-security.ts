/**
 * Enterprise-grade admin security configuration
 * Following industry best practices for administrative access control
 */

export const ADMIN_SECURITY_CONFIG = {
  // Obscured admin login path - should be kept secret
  ADMIN_LOGIN_PATH: "/sys-4a7404d6f114b5b0",

  // Admin session timeout (30 minutes for security)
  ADMIN_SESSION_TIMEOUT: 30 * 60 * 1000,

  // Admin rate limiting (stricter than regular users)
  ADMIN_RATE_LIMIT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50, // 50 requests per minute
  },

  // Admin IP whitelist (empty array allows all IPs in development)
  ADMIN_IP_WHITELIST: process.env.ADMIN_IP_WHITELIST?.split(",") || [],

  // Admin security headers
  ADMIN_SECURITY_HEADERS: {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  },

  // Admin audit logging configuration
  ADMIN_AUDIT_CONFIG: {
    logAllRequests: true,
    logFailedAttempts: true,
    logIPAddresses: true,
    logUserAgents: true,
  },
} as const;

/**
 * Validates if an IP address is allowed for admin access
 */
export function isAdminIPAllowed(ip: string): boolean {
  const whitelist = ADMIN_SECURITY_CONFIG.ADMIN_IP_WHITELIST;

  // If no whitelist is configured, allow all IPs (for development)
  if (whitelist.length === 0) {
    return true;
  }

  // Check if IP is in whitelist
  return whitelist.includes(ip);
}

/**
 * Gets client IP address from request headers
 */
export function getClientIP(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const realIP = headers.get("x-real-ip");
  const remoteAddr = headers.get("remote-addr");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return realIP || remoteAddr || "unknown";
}

/**
 * Generates a secure admin session token with additional metadata
 */
export function generateAdminSessionMetadata(userId: string, ip: string) {
  return {
    userId,
    ip,
    createdAt: Date.now(),
    expiresAt: Date.now() + ADMIN_SECURITY_CONFIG.ADMIN_SESSION_TIMEOUT,
    isAdmin: true,
  };
}

/**
 * Security event types for admin actions
 */
export const ADMIN_SECURITY_EVENTS = {
  LOGIN_SUCCESS: "admin.login.success",
  LOGIN_FAILURE: "admin.login.failure",
  UNAUTHORIZED_ACCESS: "admin.unauthorized_access",
  IP_BLOCKED: "admin.ip_blocked",
  RATE_LIMIT_EXCEEDED: "admin.rate_limit_exceeded",
  SESSION_EXPIRED: "admin.session_expired",
  PRIVILEGE_ESCALATION: "admin.privilege_escalation",
} as const;
