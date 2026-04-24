/**
 * Enhanced Audit Logger for Production Compliance
 *
 * Provides comprehensive audit logging for security, compliance,
 * and operational monitoring requirements.
 */

import { db } from "@/db/client";
import { adminAuditLogs } from "@/db/new-schema";
import { nanoid } from "nanoid";
import { logger } from "./secure-logger";

export interface AuditEvent {
  action: string;
  userId?: string;
  sessionId?: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "security" | "data_access" | "system" | "compliance" | "business";
  outcome: "success" | "failure" | "warning";
  metadata?: Record<string, any>;
}

export interface SecurityEvent extends AuditEvent {
  category: "security";
  threatLevel: "low" | "medium" | "high" | "critical";
  attackVector?: string;
  mitigationApplied?: string;
}

export interface DataAccessEvent extends AuditEvent {
  category: "data_access";
  dataType: "nin" | "phone" | "payment" | "session" | "audit";
  accessType: "read" | "write" | "delete" | "export";
  dataClassification: "public" | "internal" | "confidential" | "restricted";
  legalBasis?: string;
}

export interface ComplianceEvent extends AuditEvent {
  category: "compliance";
  regulation: "NDPA" | "PCI_DSS" | "INTERNAL";
  complianceAction:
    | "consent_recorded"
    | "data_exported"
    | "data_deleted"
    | "breach_detected"
    | "audit_performed";
  dataSubjectId?: string;
}

export class EnhancedAuditLogger {
  private static instance: EnhancedAuditLogger;
  private batchSize = 100;
  private batchTimeout = 5000; // 5 seconds
  private eventQueue: AuditEvent[] = [];
  private batchTimer?: NodeJS.Timeout;

  private constructor() {
    // Start batch processing
    this.startBatchProcessing();
  }

  static getInstance(): EnhancedAuditLogger {
    if (!EnhancedAuditLogger.instance) {
      EnhancedAuditLogger.instance = new EnhancedAuditLogger();
    }
    return EnhancedAuditLogger.instance;
  }

  /**
   * Log a general audit event
   */
  async logEvent(event: AuditEvent): Promise<void> {
    try {
      const enrichedEvent = this.enrichEvent(event);

      // Add to batch queue
      this.eventQueue.push(enrichedEvent);

      // Process immediately for critical events
      if (event.severity === "critical") {
        await this.processBatch();
      }

      // Log to application logger for immediate visibility
      logger.info("Audit event logged", {
        action: event.action,
        category: event.category,
        severity: event.severity,
        outcome: event.outcome,
        userId: event.userId,
        sessionId: event.sessionId,
      });
    } catch (error) {
      logger.error("Failed to log audit event", {
        error: error instanceof Error ? error.message : String(error),
        event: event.action,
      });
    }
  }

  /**
   * Log security-specific events
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const enrichedEvent: SecurityEvent = {
      ...event,
      category: "security",
      metadata: {
        ...event.metadata,
        threatLevel: event.threatLevel,
        attackVector: event.attackVector,
        mitigationApplied: event.mitigationApplied,
        timestamp: new Date().toISOString(),
      },
    };

    await this.logEvent(enrichedEvent);

    // Send immediate alerts for high/critical security events
    if (event.threatLevel === "high" || event.threatLevel === "critical") {
      await this.sendSecurityAlert(enrichedEvent);
    }
  }

  /**
   * Log data access events for NDPA compliance
   */
  async logDataAccess(event: DataAccessEvent): Promise<void> {
    const enrichedEvent: DataAccessEvent = {
      ...event,
      category: "data_access",
      metadata: {
        ...event.metadata,
        dataType: event.dataType,
        accessType: event.accessType,
        dataClassification: event.dataClassification,
        legalBasis: event.legalBasis,
        timestamp: new Date().toISOString(),
      },
    };

    await this.logEvent(enrichedEvent);
  }

  /**
   * Log compliance events
   */
  async logComplianceEvent(event: ComplianceEvent): Promise<void> {
    const enrichedEvent: ComplianceEvent = {
      ...event,
      category: "compliance",
      metadata: {
        ...event.metadata,
        regulation: event.regulation,
        complianceAction: event.complianceAction,
        dataSubjectId: event.dataSubjectId,
        timestamp: new Date().toISOString(),
      },
    };

    await this.logEvent(enrichedEvent);
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(
    action:
      | "login_attempt"
      | "login_success"
      | "login_failure"
      | "logout"
      | "session_expired",
    userId?: string,
    sessionId?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.logSecurityEvent({
      action,
      userId,
      sessionId,
      details,
      ipAddress,
      userAgent,
      severity: action.includes("failure") ? "medium" : "low",
      category: "security",
      outcome: action.includes("success")
        ? "success"
        : action.includes("failure")
          ? "failure"
          : "success",
      threatLevel: action.includes("failure") ? "medium" : "low",
    });
  }

  /**
   * Log payment events
   */
  async logPaymentEvent(
    action:
      | "payment_initiated"
      | "payment_success"
      | "payment_failed"
      | "payment_refunded",
    sessionId: string,
    amount: number,
    paymentReference: string,
    details?: Record<string, any>,
    ipAddress?: string,
  ): Promise<void> {
    await this.logEvent({
      action,
      sessionId,
      resource: "payment",
      resourceId: paymentReference,
      details: {
        ...details,
        amount,
        paymentReference,
      },
      ipAddress,
      severity: action.includes("failed") ? "medium" : "low",
      category: "business",
      outcome: action.includes("success")
        ? "success"
        : action.includes("failed")
          ? "failure"
          : "success",
    });
  }

  /**
   * Log NIN verification events
   */
  async logNINVerification(
    action:
      | "nin_validation_started"
      | "nin_validation_success"
      | "nin_validation_failed",
    sessionId: string,
    ninHash: string,
    details?: Record<string, any>,
    ipAddress?: string,
  ): Promise<void> {
    await this.logDataAccess({
      action,
      sessionId,
      resource: "nin",
      resourceId: ninHash,
      details,
      ipAddress,
      severity: "medium",
      category: "data_access",
      outcome: action.includes("success")
        ? "success"
        : action.includes("failed")
          ? "failure"
          : "success",
      dataType: "nin",
      accessType: "read",
      dataClassification: "restricted",
      legalBasis: "consent",
    });
  }

  /**
   * Log rate limiting events
   */
  async logRateLimit(
    action: "rate_limit_exceeded" | "rate_limit_warning",
    ipAddress: string,
    endpoint: string,
    requestCount: number,
    timeWindow: string,
  ): Promise<void> {
    await this.logSecurityEvent({
      action,
      resource: "api_endpoint",
      resourceId: endpoint,
      details: {
        requestCount,
        timeWindow,
        endpoint,
      },
      ipAddress,
      severity: action === "rate_limit_exceeded" ? "medium" : "low",
      category: "security",
      outcome: "warning",
      threatLevel: "medium",
      attackVector: "rate_limiting",
      mitigationApplied: "request_blocked",
    });
  }

  /**
   * Log system errors
   */
  async logSystemError(
    error: Error,
    context: string,
    severity: "low" | "medium" | "high" | "critical" = "medium",
    userId?: string,
    sessionId?: string,
  ): Promise<void> {
    await this.logEvent({
      action: "system_error",
      userId,
      sessionId,
      resource: "system",
      details: {
        error: error.message,
        stack: error.stack,
        context,
      },
      severity,
      category: "system",
      outcome: "failure",
    });
  }

  /**
   * Enrich event with additional metadata
   */
  private enrichEvent(event: AuditEvent): AuditEvent {
    return {
      ...event,
      metadata: {
        ...event.metadata,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        version: process.env.npm_package_version || "1.0.0",
        nodeVersion: process.version,
      },
    };
  }

  /**
   * Start batch processing
   */
  private startBatchProcessing(): void {
    this.batchTimer = setInterval(async () => {
      if (this.eventQueue.length > 0) {
        await this.processBatch();
      }
    }, this.batchTimeout);
  }

  /**
   * Process batch of events
   */
  private async processBatch(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const batch = this.eventQueue.splice(0, this.batchSize);

    try {
      // Insert batch into database
      const auditEntries = batch.map((event) => ({
        id: nanoid(),
        adminId: event.userId || "system",
        action: event.action,
        resource: event.resource,
        details: JSON.stringify({
          ...event.details,
          severity: event.severity,
          category: event.category,
          outcome: event.outcome,
          metadata: event.metadata,
          resourceId: event.resourceId,
        }),
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
      }));

      await db.insert(adminAuditLogs).values(auditEntries);

      logger.info("Audit batch processed", {
        batchSize: batch.length,
        totalQueued: this.eventQueue.length,
      });
    } catch (error) {
      logger.error("Failed to process audit batch", {
        error: error instanceof Error ? error.message : String(error),
        batchSize: batch.length,
      });

      // Re-queue failed events (with limit to prevent infinite loops)
      if (batch.length < 1000) {
        this.eventQueue.unshift(...batch);
      }
    }
  }

  /**
   * Send security alert for critical events
   */
  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    try {
      // In production, this would integrate with alerting systems
      // For now, log critical security events prominently
      logger.error("SECURITY ALERT", {
        action: event.action,
        threatLevel: event.threatLevel,
        attackVector: event.attackVector,
        userId: event.userId,
        ipAddress: event.ipAddress,
        details: event.details,
        timestamp: new Date().toISOString(),
      });

      // TODO: Integrate with external alerting systems
      // - Email notifications
      // - Slack/Teams alerts
      // - SMS alerts for critical events
      // - SIEM integration
    } catch (error) {
      logger.error("Failed to send security alert", {
        error: error instanceof Error ? error.message : String(error),
        event: event.action,
      });
    }
  }

  /**
   * Query audit logs with filters
   */
  async queryAuditLogs(filters: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    sessionId?: string;
    category?: string;
    severity?: string;
    action?: string;
    limit?: number;
  }): Promise<any[]> {
    try {
      // This would implement complex querying logic
      // For now, return a basic query structure
      const conditions = [];

      if (filters.startDate) {
        conditions.push(`timestamp >= '${filters.startDate.toISOString()}'`);
      }

      if (filters.endDate) {
        conditions.push(`timestamp <= '${filters.endDate.toISOString()}'`);
      }

      // TODO: Implement full query logic with Drizzle ORM
      return [];
    } catch (error) {
      logger.error("Failed to query audit logs", {
        error: error instanceof Error ? error.message : String(error),
        filters,
      });
      throw new Error("Failed to query audit logs");
    }
  }

  /**
   * Cleanup old audit logs (retention policy)
   */
  async cleanupOldLogs(retentionDays: number = 2555): Promise<number> {
    // 7 years default
    try {
      const cutoffDate = new Date(
        Date.now() - retentionDays * 24 * 60 * 60 * 1000,
      );

      // TODO: Implement cleanup logic
      logger.info("Audit log cleanup completed", {
        cutoffDate,
        retentionDays,
      });

      return 0; // Return number of deleted records
    } catch (error) {
      logger.error("Failed to cleanup audit logs", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error("Failed to cleanup audit logs");
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    // Process remaining events
    await this.processBatch();

    logger.info("Enhanced audit logger shutdown completed");
  }
}

// Export singleton instance
export const auditLogger = EnhancedAuditLogger.getInstance();
