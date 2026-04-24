/**
 * Nigeria Data Protection Act (NDPA) Compliance Module
 *
 * This module implements NDPA compliance requirements for data processing,
 * consent management, and data subject rights.
 */

import { db } from "@/db/client";
import { adminAuditLogs, verificationSessions } from "@/db/new-schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { logger } from "@/lib/security/secure-logger";
import { nanoid } from "nanoid";

export interface DataProcessingConsent {
  userId?: string;
  sessionId: string;
  phoneNumber: string;
  consentType: "nin_verification" | "data_processing" | "marketing";
  consentGiven: boolean;
  consentTimestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  legalBasis:
    | "consent"
    | "contract"
    | "legal_obligation"
    | "vital_interests"
    | "public_task"
    | "legitimate_interests";
  purpose: string;
  dataCategories: string[];
  retentionPeriod: number; // in days
}

export interface DataSubjectRequest {
  requestId: string;
  requestType:
    | "access"
    | "rectification"
    | "erasure"
    | "portability"
    | "restriction"
    | "objection";
  phoneNumber: string;
  email?: string;
  requestDetails: string;
  status: "pending" | "processing" | "completed" | "rejected";
  submittedAt: Date;
  processedAt?: Date;
  responseDetails?: string;
}

export class NDPAComplianceService {
  private static readonly DATA_RETENTION_DAYS = parseInt(
    process.env.DATA_RETENTION_DAYS || "365",
  );
  private static readonly BREACH_NOTIFICATION_HOURS = 72;

  /**
   * Record data processing consent
   */
  static async recordConsent(consent: DataProcessingConsent): Promise<void> {
    try {
      // Store consent record
      await db.insert(adminAuditLogs).values({
        id: nanoid(),
        adminId: consent.userId || "system",
        action: "data_consent_recorded",
        details: JSON.stringify({
          consentType: consent.consentType,
          consentGiven: consent.consentGiven,
          legalBasis: consent.legalBasis,
          purpose: consent.purpose,
          dataCategories: consent.dataCategories,
          retentionPeriod: consent.retentionPeriod,
          phoneNumber: consent.phoneNumber.substring(0, 8) + "***", // Masked for logging
        }),
        ipAddress: consent.ipAddress,
        userAgent: consent.userAgent,
      });

      logger.info("NDPA consent recorded", {
        sessionId: consent.sessionId,
        consentType: consent.consentType,
        consentGiven: consent.consentGiven,
        legalBasis: consent.legalBasis,
        purpose: consent.purpose,
      });
    } catch (error) {
      logger.error("Failed to record NDPA consent", {
        error: error instanceof Error ? error.message : String(error),
        sessionId: consent.sessionId,
      });
      throw new Error("Failed to record consent");
    }
  }

  /**
   * Validate legal basis for data processing
   */
  static validateLegalBasis(
    purpose: string,
    dataCategories: string[],
    legalBasis: DataProcessingConsent["legalBasis"],
  ): { valid: boolean; reason?: string } {
    // NIN verification requires explicit consent or legal obligation
    if (dataCategories.includes("nin") || dataCategories.includes("identity")) {
      if (!["consent", "legal_obligation"].includes(legalBasis)) {
        return {
          valid: false,
          reason:
            "NIN processing requires explicit consent or legal obligation",
        };
      }
    }

    // Payment processing can use contract as legal basis
    if (purpose.includes("payment") && legalBasis === "contract") {
      return { valid: true };
    }

    // Marketing requires explicit consent
    if (purpose.includes("marketing") && legalBasis !== "consent") {
      return {
        valid: false,
        reason: "Marketing activities require explicit consent",
      };
    }

    return { valid: true };
  }

  /**
   * Process data subject access request
   */
  static async processAccessRequest(phoneNumber: string): Promise<{
    personalData: any;
    processingActivities: any[];
    retentionPeriods: any[];
  }> {
    try {
      // Get all verification sessions for this phone number
      const sessions = await db.query.verificationSessions.findMany({
        where: eq(verificationSessions.phoneNumber, phoneNumber),
        orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
      });

      // Get audit logs for this phone number
      const auditEntries = await db.query.adminAuditLogs.findMany({
        where: and(
          eq(adminAuditLogs.details, {
            phoneNumber: phoneNumber.substring(0, 8) + "***",
          }),
        ),
        orderBy: (logs, { desc }) => [desc(logs.createdAt)],
        limit: 100,
      });

      const personalData = {
        phoneNumber: phoneNumber,
        verificationSessions: sessions.map((session) => ({
          sessionId: session.id,
          status: session.status,
          createdAt: session.createdAt,
          dataLayer: session.dataLayer,
          // NIN is encrypted, don't include in access request
          hasNIN: !!session.encryptedNin,
        })),
        totalSessions: sessions.length,
      };

      const processingActivities = auditEntries.map((entry) => ({
        activity: entry.action,
        timestamp: entry.createdAt,
        purpose: this.getProcessingPurpose(entry.action),
        legalBasis: this.getLegalBasisForActivity(entry.action),
      }));

      const retentionPeriods = [
        {
          dataCategory: "Verification Sessions",
          retentionPeriod: `${this.DATA_RETENTION_DAYS} days`,
          deletionDate: new Date(
            Date.now() + this.DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000,
          ),
        },
        {
          dataCategory: "Audit Logs",
          retentionPeriod: "7 years (legal requirement)",
          deletionDate: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000),
        },
      ];

      // Log the access request
      await this.logDataSubjectRequest({
        requestId: nanoid(),
        requestType: "access",
        phoneNumber,
        requestDetails: "Data subject access request processed",
        status: "completed",
        submittedAt: new Date(),
        processedAt: new Date(),
      });

      return {
        personalData,
        processingActivities,
        retentionPeriods,
      };
    } catch (error) {
      logger.error("Failed to process access request", {
        error: error instanceof Error ? error.message : String(error),
        phoneNumber: phoneNumber.substring(0, 8) + "***",
      });
      throw new Error("Failed to process access request");
    }
  }

  /**
   * Process data erasure request (Right to be Forgotten)
   */
  static async processErasureRequest(
    phoneNumber: string,
    reason: string,
  ): Promise<{ success: boolean; deletedRecords: number }> {
    try {
      // Check if there are legal obligations to retain data
      const recentSessions = await db.query.verificationSessions.findMany({
        where: and(
          eq(verificationSessions.phoneNumber, phoneNumber),
          gte(
            verificationSessions.createdAt,
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          ), // 30 days
        ),
      });

      if (recentSessions.some((s) => s.status === "completed")) {
        // Cannot delete recent completed verifications due to legal obligations
        await this.logDataSubjectRequest({
          requestId: nanoid(),
          requestType: "erasure",
          phoneNumber,
          requestDetails: reason,
          status: "rejected",
          submittedAt: new Date(),
          processedAt: new Date(),
          responseDetails:
            "Cannot delete recent verification records due to legal obligations",
        });

        return { success: false, deletedRecords: 0 };
      }

      // Delete old verification sessions (older than retention period)
      const oldSessions = await db.query.verificationSessions.findMany({
        where: and(
          eq(verificationSessions.phoneNumber, phoneNumber),
          lte(
            verificationSessions.createdAt,
            new Date(
              Date.now() - this.DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000,
            ),
          ),
        ),
      });

      let deletedRecords = 0;
      for (const session of oldSessions) {
        await db
          .delete(verificationSessions)
          .where(eq(verificationSessions.id, session.id));
        deletedRecords++;
      }

      // Log the erasure request
      await this.logDataSubjectRequest({
        requestId: nanoid(),
        requestType: "erasure",
        phoneNumber,
        requestDetails: reason,
        status: "completed",
        submittedAt: new Date(),
        processedAt: new Date(),
        responseDetails: `Deleted ${deletedRecords} old verification records`,
      });

      logger.info("Data erasure request processed", {
        phoneNumber: phoneNumber.substring(0, 8) + "***",
        deletedRecords,
        reason,
      });

      return { success: true, deletedRecords };
    } catch (error) {
      logger.error("Failed to process erasure request", {
        error: error instanceof Error ? error.message : String(error),
        phoneNumber: phoneNumber.substring(0, 8) + "***",
      });
      throw new Error("Failed to process erasure request");
    }
  }

  /**
   * Automated data retention cleanup
   */
  static async performDataRetentionCleanup(): Promise<{
    deletedSessions: number;
    deletedAuditLogs: number;
  }> {
    try {
      const cutoffDate = new Date(
        Date.now() - this.DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000,
      );

      // Delete expired verification sessions
      const expiredSessions = await db.query.verificationSessions.findMany({
        where: and(
          lte(verificationSessions.createdAt, cutoffDate),
          eq(verificationSessions.status, "expired"),
        ),
      });

      let deletedSessions = 0;
      for (const session of expiredSessions) {
        await db
          .delete(verificationSessions)
          .where(eq(verificationSessions.id, session.id));
        deletedSessions++;
      }

      // Keep audit logs for 7 years (legal requirement)
      const auditCutoffDate = new Date(
        Date.now() - 7 * 365 * 24 * 60 * 60 * 1000,
      );
      const expiredAuditLogs = await db.query.adminAuditLogs.findMany({
        where: lte(adminAuditLogs.createdAt, auditCutoffDate),
      });

      let deletedAuditLogs = 0;
      for (const log of expiredAuditLogs) {
        await db.delete(adminAuditLogs).where(eq(adminAuditLogs.id, log.id));
        deletedAuditLogs++;
      }

      logger.info("Data retention cleanup completed", {
        deletedSessions,
        deletedAuditLogs,
        cutoffDate,
      });

      return { deletedSessions, deletedAuditLogs };
    } catch (error) {
      logger.error("Data retention cleanup failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error("Data retention cleanup failed");
    }
  }

  /**
   * Log data subject request
   */
  private static async logDataSubjectRequest(
    request: DataSubjectRequest,
  ): Promise<void> {
    await db.insert(adminAuditLogs).values({
      id: nanoid(),
      adminId: "system", // System-generated request
      action: `data_subject_${request.requestType}_request`,
      details: JSON.stringify({
        requestId: request.requestId,
        requestType: request.requestType,
        phoneNumber: request.phoneNumber.substring(0, 8) + "***",
        status: request.status,
        requestDetails: request.requestDetails,
        responseDetails: request.responseDetails,
      }),
      createdAt: request.submittedAt,
    });
  }

  /**
   * Get processing purpose for activity
   */
  private static getProcessingPurpose(action: string): string {
    const purposeMap: Record<string, string> = {
      session_created: "NIN verification service",
      otp_sent: "Phone number verification",
      payment_processed: "Service payment processing",
      nin_verified: "Identity verification",
      data_consent_recorded: "Consent management",
    };

    return purposeMap[action] || "System operation";
  }

  /**
   * Get legal basis for activity
   */
  private static getLegalBasisForActivity(action: string): string {
    const legalBasisMap: Record<string, string> = {
      session_created: "consent",
      otp_sent: "consent",
      payment_processed: "contract",
      nin_verified: "legal_obligation",
      data_consent_recorded: "legal_obligation",
    };

    return legalBasisMap[action] || "legitimate_interests";
  }

  /**
   * Generate NDPA compliance report
   */
  static async generateComplianceReport(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalProcessingActivities: number;
    consentRecords: number;
    dataSubjectRequests: number;
    dataRetentionCompliance: boolean;
    securityIncidents: number;
  }> {
    try {
      const auditEntries = await db.query.adminAuditLogs.findMany({
        where: and(
          gte(adminAuditLogs.createdAt, startDate),
          lte(adminAuditLogs.createdAt, endDate),
        ),
      });

      const totalProcessingActivities = auditEntries.length;
      const consentRecords = auditEntries.filter(
        (e) => e.action === "data_consent_recorded",
      ).length;
      const dataSubjectRequests = auditEntries.filter(
        (e) =>
          e.action.includes("data_subject_") && e.action.includes("_request"),
      ).length;
      const securityIncidents = auditEntries.filter(
        (e) => e.action.includes("security_") || e.action.includes("breach_"),
      ).length;

      // Check data retention compliance
      const oldSessions = await db.query.verificationSessions.findMany({
        where: lte(
          verificationSessions.createdAt,
          new Date(Date.now() - this.DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000),
        ),
      });

      const dataRetentionCompliance = oldSessions.length === 0;

      return {
        totalProcessingActivities,
        consentRecords,
        dataSubjectRequests,
        dataRetentionCompliance,
        securityIncidents,
      };
    } catch (error) {
      logger.error("Failed to generate compliance report", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error("Failed to generate compliance report");
    }
  }
}
