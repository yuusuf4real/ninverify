import { SessionManager } from "./session-manager";
import { verifyNinWithYouVerify } from "./youverify";
import { DataLayerFilter } from "./data-layer-filter";
import { decrypt } from "./security/encryption";
import { db } from "@/db/client";
import { verificationResults, verificationSessions } from "@/db/new-schema";
import { eq } from "drizzle-orm";
import { logger } from "./security/secure-logger";

export class VerificationService {
  /**
   * Process NIN verification after successful payment
   */
  static async processVerification(sessionId: string): Promise<void> {
    try {
      logger.info("Starting verification process for session:", {
        sessionId,
      });

      // Get session details
      const session = await SessionManager.getSessionForAdmin(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      if (!session.encryptedNin || !session.dataLayerSelected) {
        throw new Error("Missing NIN or data layer selection");
      }

      // Decrypt the NIN for API call
      const actualNin = decrypt(session.encryptedNin);

      // Update session status to indicate verification is in progress
      await SessionManager.updateSessionStatus(
        sessionId,
        "verification_in_progress",
        {
          apiCallStartedAt: new Date(),
        },
      );

      // Call NIMC API via YouVerify
      logger.info("Calling NIMC API for session:", { sessionId });
      const nimcResponse = await verifyNinWithYouVerify(actualNin);

      // Update session with API call completion
      await SessionManager.updateSessionStatus(
        sessionId,
        "verification_completed",
        {
          apiCallMadeAt: new Date(),
          apiResponseStatus: "success",
          providerReference: nimcResponse.data?.id,
        },
      );

      // Filter response based on selected data layer
      const filteredData = DataLayerFilter.filterResponse(
        nimcResponse as unknown as import("./data-layer-filter").NIMCApiResponse,
        session.dataLayerSelected,
        sessionId,
      );

      // Store filtered results
      await db.insert(verificationResults).values({
        id: sessionId,
        sessionId,
        fullName: filteredData.fullName,
        dateOfBirth: filteredData.dateOfBirth,
        phoneFromNimc: filteredData.phoneFromNimc,
        gender: filteredData.gender,
        photoUrl: filteredData.photoUrl,
        signatureUrl: filteredData.signatureUrl,
        addressLine: filteredData.addressLine,
        town: filteredData.town,
        lga: filteredData.lga,
        state: filteredData.state,
        rawApiResponse: nimcResponse as unknown as Record<string, unknown>,
      });

      // Clear encrypted NIN for security
      await this.clearEncryptedNin(sessionId);

      logger.info("Verification completed successfully for session:", {
        sessionId,
      });
    } catch (error) {
      logger.error("Verification failed for session:", {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });

      // Update session with error status
      await SessionManager.updateSessionStatus(sessionId, "failed", {
        apiCallMadeAt: new Date(),
        apiResponseStatus: "failed",
        errorMessage:
          error instanceof Error ? error.message : "Verification failed",
      });

      // Clear encrypted NIN even on failure for security
      await this.clearEncryptedNin(sessionId);

      throw error;
    }
  }

  /**
   * Clear encrypted NIN from session for security
   */
  private static async clearEncryptedNin(sessionId: string): Promise<void> {
    try {
      await db
        .update(verificationSessions)
        .set({
          encryptedNin: null,
          updatedAt: new Date(),
        })
        .where(eq(verificationSessions.id, sessionId));
    } catch (error) {
      logger.error("Failed to clear encrypted NIN for session:", {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Retry failed verification
   */
  static async retryVerification(sessionId: string): Promise<void> {
    const session = await SessionManager.getSessionForAdmin(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== "failed") {
      throw new Error("Can only retry failed verifications");
    }

    if (!session.encryptedNin) {
      throw new Error("NIN no longer available for retry. Please start over.");
    }

    await this.processVerification(sessionId);
  }
}
