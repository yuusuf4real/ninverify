import { nanoid } from "nanoid";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/db/client";
import { verificationSessions, otpSessions } from "@/db/new-schema";
import { eq, and, gt, lt } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key",
);

export interface SessionData {
  sessionId: string;
  phoneNumber: string;
  status: string;
  expiresAt: Date;
}

export class SessionManager {
  private static SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Create a new verification session after OTP verification
   */
  static async createSession(
    phoneNumber: string,
    otpSessionId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ sessionId: string; sessionToken: string }> {
    const sessionId = nanoid();
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION);

    // Create session record
    await db.insert(verificationSessions).values({
      id: sessionId,
      sessionToken: sessionId, // Will be replaced with JWT
      phoneNumber,
      otpSessionId,
      status: "otp_verified",
      expiresAt,
      ipAddress,
      userAgent,
    });

    // Generate JWT token
    const sessionToken = await new SignJWT({
      sessionId,
      phoneNumber,
      exp: Math.floor(expiresAt.getTime() / 1000),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(JWT_SECRET);

    // Update session with JWT token
    await db
      .update(verificationSessions)
      .set({ sessionToken })
      .where(eq(verificationSessions.id, sessionId));

    return { sessionId, sessionToken };
  }

  /**
   * Verify and get session data from token
   */
  static async verifySession(token: string): Promise<SessionData | null> {
    try {
      console.log("[Session] Verifying token...");

      const { payload } = await jwtVerify(token, JWT_SECRET);
      const sessionId = payload.sessionId as string;

      console.log("[Session] Token verified, sessionId:", sessionId);

      // Check if session exists and is not expired
      const session = await db.query.verificationSessions.findFirst({
        where: and(
          eq(verificationSessions.id, sessionId),
          gt(verificationSessions.expiresAt, new Date()),
        ),
      });

      if (!session) {
        console.log("[Session] Session not found or expired:", sessionId);
        return null;
      }

      console.log("[Session] Session verified successfully:", {
        sessionId: session.id,
        status: session.status,
        expiresAt: session.expiresAt,
      });

      return {
        sessionId: session.id,
        phoneNumber: session.phoneNumber,
        status: session.status,
        expiresAt: session.expiresAt,
      };
    } catch (error) {
      console.error("[Session] Verification error:", {
        error: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : "Unknown",
      });
      return null;
    }
  }

  /**
   * Update session status
   */
  static async updateSessionStatus(
    sessionId: string,
    status: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (metadata) {
      updateData.metadata = metadata;
    }

    if (status === "verification_completed") {
      updateData.completedAt = new Date();
    }

    await db
      .update(verificationSessions)
      .set(updateData)
      .where(eq(verificationSessions.id, sessionId));
  }

  /**
   * Add NIN and data layer selection to session
   */
  static async updateSessionWithNIN(
    sessionId: string,
    ninMasked: string,
    dataLayer: "demographic" | "biometric" | "full",
    encryptedNin?: string,
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      ninMasked,
      dataLayerSelected: dataLayer,
      status: "nin_entered",
      updatedAt: new Date(),
    };

    if (encryptedNin) {
      updateData.encryptedNin = encryptedNin;
    }

    await db
      .update(verificationSessions)
      .set(updateData)
      .where(eq(verificationSessions.id, sessionId));
  }

  /**
   * Update session with payment information
   */
  static async updateSessionWithPayment(
    sessionId: string,
    paymentReference: string,
    amount: number,
    status: "pending" | "completed" | "failed" = "pending",
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      paymentReference,
      paymentAmount: amount,
      paymentStatus: status,
      status: status === "completed" ? "payment_completed" : "payment_pending",
      updatedAt: new Date(),
    };

    if (status === "completed") {
      updateData.paymentCompletedAt = new Date();
    }

    await db
      .update(verificationSessions)
      .set(updateData)
      .where(eq(verificationSessions.id, sessionId));
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();

    // Delete expired sessions
    await db
      .delete(verificationSessions)
      .where(
        and(
          eq(verificationSessions.status, "expired"),
          lt(verificationSessions.expiresAt, now),
        ),
      );

    // Delete expired OTP sessions
    await db.delete(otpSessions).where(lt(otpSessions.expiresAt, now));
  }

  /**
   * Get session for admin dashboard
   */
  static async getSessionForAdmin(sessionId: string) {
    return await db.query.verificationSessions.findFirst({
      where: eq(verificationSessions.id, sessionId),
      with: {
        verificationResults: true,
      },
    });
  }
}
