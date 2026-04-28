import { NextRequest, NextResponse } from "next/server";
import { SessionManager } from "@/lib/session-manager";
import { VerificationService } from "@/lib/verification-service";
import { logger } from "@/lib/security/secure-logger";

export async function POST(request: NextRequest) {
  try {
    // Get session from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid session token" },
        { status: 401 },
      );
    }

    const sessionToken = authHeader.substring(7);
    const session = await SessionManager.verifySession(sessionToken);

    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 },
      );
    }

    // Get session details
    const sessionDetails = await SessionManager.getSessionForAdmin(
      session.sessionId,
    );
    if (!sessionDetails) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if session is in a state that can be processed
    if (
      sessionDetails.status !== "payment_completed" &&
      sessionDetails.status !== "failed"
    ) {
      return NextResponse.json(
        {
          error: `Cannot trigger verification for session in status: ${sessionDetails.status}`,
        },
        { status: 400 },
      );
    }

    // Trigger real verification using VerificationService
    logger.info("Manually triggering verification for session:", {
      sessionId: session.sessionId,
    });

    try {
      await VerificationService.processVerification(session.sessionId);

      return NextResponse.json({
        success: true,
        message: "Verification triggered successfully",
        sessionId: session.sessionId,
        status: "verification_completed",
      });
    } catch (error) {
      logger.error("Verification failed:", error);
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Verification failed",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error("Manual verification trigger failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
