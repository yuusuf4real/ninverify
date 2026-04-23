import { NextRequest, NextResponse } from "next/server";
import { SessionManager } from "@/lib/session-manager";
import { DataLayerFilter } from "@/lib/data-layer-filter";
import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { verificationResults } from "@/db/new-schema";
import { logger } from "@/lib/security/secure-logger";

export async function GET(request: NextRequest) {
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

    // Check if verification is completed
    if (sessionDetails.status !== "verification_completed") {
      return NextResponse.json({
        status: sessionDetails.status,
        message: getStatusMessage(sessionDetails.status),
        paymentStatus: sessionDetails.paymentStatus,
      });
    }

    // Get verification results
    const results = await db.query.verificationResults.findFirst({
      where: eq(verificationResults.sessionId, session.sessionId),
    });

    if (!results) {
      return NextResponse.json(
        { error: "Verification results not found" },
        { status: 404 },
      );
    }

    // Prepare filtered data for response
    const filteredData: Record<string, unknown> = {
      fullName: results.fullName,
      dateOfBirth: results.dateOfBirth,
      phoneFromNimc: results.phoneFromNimc,
      gender: results.gender,
      dataLayer: sessionDetails.dataLayerSelected,
      verificationId: session.sessionId,
      timestamp: results.createdAt,
    };

    // Add conditional fields based on data layer
    if (
      sessionDetails.dataLayerSelected === "biometric" ||
      sessionDetails.dataLayerSelected === "full"
    ) {
      if (results.photoUrl) filteredData.photoUrl = results.photoUrl;
      if (results.signatureUrl)
        filteredData.signatureUrl = results.signatureUrl;
    }

    if (sessionDetails.dataLayerSelected === "full") {
      filteredData.address = {
        addressLine: results.addressLine,
        town: results.town,
        lga: results.lga,
        state: results.state,
      };
    }

    // Get printable document data
    const printableData = DataLayerFilter.getPrintableData(
      filteredData as unknown as import("@/lib/data-layer-filter").FilteredVerificationData,
      sessionDetails.ninMasked!,
      session.sessionId,
    );

    return NextResponse.json({
      success: true,
      status: "completed",
      data: filteredData,
      printableData,
      sessionInfo: {
        sessionId: session.sessionId,
        phoneNumber: session.phoneNumber,
        dataLayer: sessionDetails.dataLayerSelected,
        verificationDate: sessionDetails.completedAt,
      },
    });
  } catch (error) {
    logger.error("Result retrieval error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case "otp_pending":
      return "Waiting for OTP verification";
    case "otp_verified":
      return "Please enter NIN and select data layer";
    case "nin_entered":
      return "Please proceed to payment";
    case "payment_pending":
      return "Payment is being processed";
    case "payment_completed":
      return "Payment successful. Verifying with NIMC...";
    case "verification_in_progress":
      return "Verifying your NIN with NIMC. Please wait...";
    case "verification_completed":
      return "Verification completed successfully";
    case "failed":
      return "Verification failed. Please try again.";
    case "expired":
      return "Session expired. Please start over.";
    default:
      return "Processing...";
  }
}
