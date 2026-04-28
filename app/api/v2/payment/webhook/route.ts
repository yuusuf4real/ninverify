import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { SessionManager } from "@/lib/session-manager";
import { VerificationService } from "@/lib/verification-service";
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

    // Trigger verification using VerificationService
    // This will decrypt the NIN and call YouVerify API
    try {
      logger.info("Triggering verification for session:", sessionId);
      await VerificationService.processVerification(sessionId);
      logger.info(
        "Verification completed successfully for session:",
        sessionId,
      );
    } catch (apiError) {
      logger.error("Verification failed for session:", {
        sessionId,
        error: apiError instanceof Error ? apiError.message : String(apiError),
      });

      // Session status is already updated to 'failed' by VerificationService
      // Note: In production, you might want to initiate a refund here
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
