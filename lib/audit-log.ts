/**
 * Audit Logging System
 *
 * COMPLIANCE: Required for NDPR/NDPA and financial regulations
 * Maintains immutable record of all sensitive operations
 *
 * SECURITY: Logs should never contain:
 * - Full NIN numbers (always masked)
 * - Passwords or API keys
 * - Full card numbers
 * - Sensitive PII beyond what's necessary
 */

import { logger } from "./security/secure-logger";

export type AuditEventType =
  | "user.registered"
  | "user.login"
  | "user.logout"
  | "wallet.funded"
  | "wallet.debited"
  | "wallet.refunded"
  | "nin.verification.initiated"
  | "nin.verification.success"
  | "nin.verification.failed"
  | "payment.initialized"
  | "payment.success"
  | "payment.failed"
  | "webhook.received"
  | "webhook.processed"
  | "webhook.failed"
  | "api.error"
  | "security.suspicious_activity";

export interface AuditLogEntry {
  timestamp: string;
  eventType: AuditEventType;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action: string;
  status: "success" | "failure" | "pending";
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}

/**
 * Log audit event
 *
 * Writes to:
 * 1. Database table for queryable audit trail
 * 2. Console for development/debugging
 * 3. External logging service (if configured)
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  const logEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  };

  // Console logging (always)
  logger.info("[AUDIT]", { entry: JSON.stringify(logEntry) });

  // Write to database (async, non-blocking)
  if (process.env.ENABLE_AUDIT_LOGGING !== "false") {
    try {
      const { db } = await import("@/db/client");
      const { auditLogs } = await import("@/db/schema");
      const { nanoid } = await import("nanoid");

      await db.insert(auditLogs).values({
        id: nanoid(),
        timestamp: new Date(entry.timestamp),
        eventType: entry.eventType,
        userId: entry.userId || null,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
        resource: entry.resource || null,
        action: entry.action,
        status: entry.status,
        metadata: entry.metadata || null,
        errorMessage: entry.errorMessage || null,
      });
    } catch (error) {
      // Don't fail the request if audit logging fails
      logger.error("[AUDIT] Failed to write to database:", error);
    }
  }

  // TODO: Send to external service (Sentry, CloudWatch, etc.)
  // if (process.env.SENTRY_DSN && entry.status === "failure") {
  //   Sentry.captureMessage(`Audit: ${entry.eventType}`, {
  //     level: "error",
  //     extra: logEntry
  //   });
  // }
}

/**
 * Log payment event with financial audit requirements
 */
export async function logPaymentEvent(
  eventType: Extract<
    AuditEventType,
    "payment.initialized" | "payment.success" | "payment.failed"
  >,
  userId: string,
  amount: number,
  reference: string,
  status: "success" | "failure" | "pending",
  metadata?: Record<string, unknown>,
): Promise<void> {
  await logAuditEvent({
    timestamp: new Date().toISOString(),
    eventType,
    userId,
    resource: "payment",
    action: eventType.split(".")[1],
    status,
    metadata: {
      amount,
      reference,
      currency: "NGN",
      ...metadata,
    },
  });
}

/**
 * Log NIN verification with data protection compliance
 */
export async function logNINVerification(
  eventType: Extract<
    AuditEventType,
    | "nin.verification.initiated"
    | "nin.verification.success"
    | "nin.verification.failed"
  >,
  userId: string,
  ninMasked: string,
  status: "success" | "failure" | "pending",
  metadata?: Record<string, unknown>,
): Promise<void> {
  await logAuditEvent({
    timestamp: new Date().toISOString(),
    eventType,
    userId,
    resource: "nin_verification",
    action: eventType.split(".")[2],
    status,
    metadata: {
      ninMasked, // Only log masked NIN
      ...metadata,
    },
  });
}

/**
 * Log security event for monitoring
 */
export async function logSecurityEvent(
  description: string,
  userId?: string,
  ipAddress?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await logAuditEvent({
    timestamp: new Date().toISOString(),
    eventType: "security.suspicious_activity",
    userId,
    ipAddress,
    resource: "security",
    action: "suspicious_activity_detected",
    status: "failure",
    metadata: {
      description,
      ...metadata,
    },
  });
}

/**
 * Log API error for debugging and monitoring
 */
export async function logAPIError(
  endpoint: string,
  error: unknown,
  userId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await logAuditEvent({
    timestamp: new Date().toISOString(),
    eventType: "api.error",
    userId,
    resource: endpoint,
    action: "api_call",
    status: "failure",
    errorMessage: error instanceof Error ? error.message : String(error),
    metadata: {
      errorStack: error instanceof Error ? error.stack : undefined,
      ...metadata,
    },
  });
}
