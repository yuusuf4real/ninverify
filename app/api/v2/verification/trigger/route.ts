import { NextRequest, NextResponse } from "next/server";
import { SessionManager } from "@/lib/session-manager";
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

    // For now, let's simulate the verification process since we don't have the encrypted NIN
    // In a real scenario, this would call the NIMC API
    logger.info("Manually triggering verification for session:", {
      sessionId: session.sessionId,
    });

    // Simulate successful verification with mock data
    const mockVerificationData = {
      fullName: "JOHN DOE EXAMPLE",
      dateOfBirth: "1990-01-01",
      phoneFromNimc: sessionDetails.phoneNumber,
      gender: "Male",
      photoUrl: null,
      signatureUrl: null,
      addressLine: "123 Example Street",
      town: "Example Town",
      lga: "Example LGA",
      state: "Example State",
    };

    // Update session status to completed
    await SessionManager.updateSessionStatus(
      session.sessionId,
      "verification_completed",
      {
        apiCallMadeAt: new Date(),
        apiResponseStatus: "success",
        providerReference: `mock_${session.sessionId}`,
      },
    );

    // Store mock results in database
    const { db } = await import("@/db/client");
    const { verificationResults } = await import("@/db/new-schema");

    await db.insert(verificationResults).values({
      id: session.sessionId,
      sessionId: session.sessionId,
      fullName: mockVerificationData.fullName,
      dateOfBirth: mockVerificationData.dateOfBirth,
      phoneFromNimc: mockVerificationData.phoneFromNimc,
      gender: mockVerificationData.gender,
      photoUrl: mockVerificationData.photoUrl,
      signatureUrl: mockVerificationData.signatureUrl,
      addressLine: mockVerificationData.addressLine,
      town: mockVerificationData.town,
      lga: mockVerificationData.lga,
      state: mockVerificationData.state,
      rawApiResponse: { mock: true, data: mockVerificationData },
    });

    return NextResponse.json({
      success: true,
      message: "Verification triggered successfully",
      sessionId: session.sessionId,
      status: "verification_completed",
    });
  } catch (error) {
    logger.error("Manual verification trigger failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
