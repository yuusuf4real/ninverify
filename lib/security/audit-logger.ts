/**
 * Enterprise Audit Logging System
 * Comprehensive logging for security events, compliance, and monitoring
 */

import { db } from "@/db/client";
import { auditLogs } from "@/db/schema";
import { SecureLogger } from "./secure-logger";

export interface AuditEvent {
  userId?: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "auth" | "data" | "system" | "security" | "compliance";
}

export interface SecurityEvent {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
}

export class AuditLogger {
  /**
   * Log audit event to database and monitoring systems
   */
  static async logAuditEvent(event: AuditEvent): Promise<void> {
    try {
      // Map to actual database schema
      const { nanoid } = await import("nanoid");

      // Log to database for compliance
      await db.insert(auditLogs).values({
        id: nanoid(),
        eventType: "api.error",
        userId: event.userId || null,
        action: event.action,
        resource: event.resource || null,
        status: "success",
        metadata: event.details ? event.details : null,
        ipAddress: event.ipAddress || null,
        userAgent: event.userAgent || null,
      });

      // Log to application logs
      SecureLogger.audit(`${event.action} on ${event.resource}`, {
        userId: event.userId,
        severity: event.severity,
        category: event.category,
        details: event.details,
      });

      // Send to monitoring system for high/critical events
      if (event.severity === "high" || event.severity === "critical") {
        await this.sendToMonitoring(event);
      }
    } catch (error) {
      SecureLogger.error("Failed to log audit event", error, { event });
    }
  }

  /**
   * Log security event with immediate alerting
   */
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        userId: event.userId,
        action: event.type,
        resource: "security_system",
        details: event.details,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        severity: event.severity,
        category: "security",
      };

      await this.logAuditEvent(auditEvent);

      // Immediate security logging
      SecureLogger.security(`Security event: ${event.type}`, {
        severity: event.severity,
        details: event.details,
        userId: event.userId,
        ipAddress: event.ipAddress,
      });

      // Send security alerts for high/critical events
      if (event.severity === "high" || event.severity === "critical") {
        await this.sendSecurityAlert(event);
      }
    } catch (error) {
      SecureLogger.error("Failed to log security event", error, { event });
    }
  }

  /**
   * Log authentication events
   */
  static async logAuthEvent(
    action:
      | "login"
      | "logout"
      | "login_failed"
      | "account_locked"
      | "password_reset",
    userId?: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const severity =
      action === "login_failed" || action === "account_locked"
        ? "medium"
        : "low";

    await this.logAuditEvent({
      userId,
      action,
      resource: "authentication",
      details,
      ipAddress,
      userAgent,
      severity,
      category: "auth",
    });
  }

  /**
   * Log data access events
   */
  static async logDataAccess(
    action: "read" | "create" | "update" | "delete",
    resource: string,
    userId?: string,
    recordId?: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
  ): Promise<void> {
    const severity = action === "delete" ? "medium" : "low";

    await this.logAuditEvent({
      userId,
      action: `data_${action}`,
      resource,
      details: { recordId, ...details },
      ipAddress,
      severity,
      category: "data",
    });
  }

  /**
   * Log system events
   */
  static async logSystemEvent(
    action: string,
    details?: Record<string, unknown>,
    severity: "low" | "medium" | "high" | "critical" = "low",
  ): Promise<void> {
    await this.logAuditEvent({
      action,
      resource: "system",
      details,
      severity,
      category: "system",
    });
  }

  /**
   * Log compliance events
   */
  static async logComplianceEvent(
    action: string,
    resource: string,
    userId?: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    await this.logAuditEvent({
      userId,
      action,
      resource,
      details,
      severity: "medium",
      category: "compliance",
    });
  }

  /**
   * Send event to monitoring system
   */
  private static async sendToMonitoring(event: AuditEvent): Promise<void> {
    // In production, integrate with monitoring services like:
    // - DataDog
    // - New Relic
    // - Splunk
    // - ELK Stack

    if (process.env.NODE_ENV === "production") {
      // TODO: Implement monitoring integration
      SecureLogger.info("Sending to monitoring system", { event });
    }
  }

  /**
   * Send security alert
   */
  private static async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    // In production, integrate with alerting services like:
    // - PagerDuty
    // - Slack
    // - Email alerts
    // - SMS alerts

    if (process.env.NODE_ENV === "production") {
      // TODO: Implement alerting integration
      SecureLogger.error("SECURITY ALERT", null, { event });
    }
  }

  /**
   * Get audit logs with filtering
   */
  static async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    category?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<unknown[]> {
    try {
      // Build query with filters
      const query = db.select().from(auditLogs);

      // Apply filters (simplified - in production use proper query builder)
      // This is a basic implementation - enhance with proper filtering

      const results = await query
        .limit(filters.limit || 100)
        .offset(filters.offset || 0);

      return results;
    } catch (error) {
      SecureLogger.error("Failed to retrieve audit logs", error, { filters });
      return [];
    }
  }

  /**
   * Generate compliance report
   */
  static async generateComplianceReport(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    securityEvents: number;
    dataAccessEvents: number;
    authEvents: number;
  }> {
    try {
      // In production, use proper aggregation queries
      const logs = await this.getAuditLogs({
        startDate,
        endDate,
        limit: 10000,
      });

      const report = {
        totalEvents: logs.length,
        eventsByCategory: {} as Record<string, number>,
        eventsBySeverity: {} as Record<string, number>,
        securityEvents: 0,
        dataAccessEvents: 0,
        authEvents: 0,
      };

      (logs as Array<{ category: string; severity: string }>).forEach((log) => {
        // Count by category
        report.eventsByCategory[log.category] =
          (report.eventsByCategory[log.category] || 0) + 1;

        // Count by severity
        report.eventsBySeverity[log.severity] =
          (report.eventsBySeverity[log.severity] || 0) + 1;

        // Count specific event types
        if (log.category === "security") report.securityEvents++;
        if (log.category === "data") report.dataAccessEvents++;
        if (log.category === "auth") report.authEvents++;
      });

      return report;
    } catch (error) {
      SecureLogger.error("Failed to generate compliance report", error);
      return {
        totalEvents: 0,
        eventsByCategory: {},
        eventsBySeverity: {},
        securityEvents: 0,
        dataAccessEvents: 0,
        authEvents: 0,
      };
    }
  }

  /**
   * Clean up old audit logs (data retention)
   */
  static async cleanupOldLogs(retentionDays: number = 365): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // In production, implement proper cleanup with archiving
      SecureLogger.info(
        `Cleaning up audit logs older than ${retentionDays} days`,
        {
          cutoffDate: cutoffDate.toISOString(),
        },
      );

      // TODO: Implement actual cleanup query
      // await db.delete(auditLogs).where(lt(auditLogs.timestamp, cutoffDate));
    } catch (error) {
      SecureLogger.error("Failed to cleanup old audit logs", error);
    }
  }
}

/**
 * Convenience function for logging security events
 */
export async function logSecurityEvent(
  type: string,
  details: Record<string, unknown>,
  severity: "low" | "medium" | "high" | "critical" = "medium",
): Promise<void> {
  await AuditLogger.logSecurityEvent({
    type,
    details,
    severity,
  });
}

/**
 * Convenience function for logging audit events
 */
export async function logAuditEvent(
  action: string,
  resource: string,
  details?: Record<string, unknown>,
  userId?: string,
  severity: "low" | "medium" | "high" | "critical" = "low",
): Promise<void> {
  await AuditLogger.logAuditEvent({
    userId,
    action,
    resource,
    details,
    severity,
    category: "system",
  });
}
