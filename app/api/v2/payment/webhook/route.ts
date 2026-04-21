import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { SessionManager } from "@/lib/session-manager";
import { verifyNinWithYouVerify } from "@/lib/youverify";
import { DataLayerFilter } from "@/lib/data-layer-filter";
import { db } from "@/db/client";
import { verificationResults } from "@/db/new-schema";
import { logger } from "@/lib/security/secure-logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    // Verify webhook signature
    const hash = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      logger.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    // Only process successful payments
    if (event.event !== "charge.success") {
      return NextResponse.json({ message: "Event ignored" });
    }

    const { reference, metadata, amount, status } = event.data;

    if (status !== "success") {
      logger.info("Payment not successful:", status);
      return NextResponse.json({ message: "Payment not successful" });
    }

    const sessionId = metadata?.sessionId;
    if (!sessionId) {
      logger.error("No session ID in payment metadata");
      return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
    }

    // Update session payment status
    await SessionManager.updateSessionWithPayment(
      sessionId,
      reference,
      amount,
      "completed",
    );

    // Get session details for NIMC API call
    const session = await SessionManager.getSessionForAdmin(sessionId);
    if (!session) {
      logger.error("Session not found:", sessionId);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Extract NIN from masked format for API call
    // Note: In production, you'd need to store the actual NIN temporarily or use a different approach
    // For now, we'll assume the NIN is reconstructable or stored securely

    try {
      // Call NIMC API via YouVerify
      logger.info("Calling NIMC API for session:", sessionId);

      // Note: This is a placeholder - you'll need to implement secure NIN storage/retrieval
      // For demo purposes, we'll simulate the API call
      const mockNin = "12345678901"; // This should come from secure temporary storage

      const nimcResponse = await verifyNinWithYouVerify(mockNin);

      // Update session with API call timestamp
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
        nimcResponse as unknown as import("@/lib/data-layer-filter").NIMCApiResponse, // Type assertion for compatibility
        session.dataLayerSelected!,
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

      logger.info(
        "Verification completed successfully for session:",
        sessionId,
      );
    } catch (apiError) {
      logger.error("NIMC API error:", apiError);

      // Update session with error status
      await SessionManager.updateSessionStatus(sessionId, "failed", {
        apiCallMadeAt: new Date(),
        apiResponseStatus: "failed",
        errorMessage:
          apiError instanceof Error ? apiError.message : "API call failed",
      });

      // Note: In production, you might want to initiate a refund here
      // or provide alternative resolution paths
    }

    return NextResponse.json({ message: "Webhook processed successfully" });
  } catch (error) {
    logger.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
