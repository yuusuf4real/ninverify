import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SessionManager } from "@/lib/session-manager";
import { logger } from "@/lib/security/secure-logger";
import { nanoid } from "nanoid";

const schema = z.object({
  email: z.string().email().optional(),
  callback_url: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, callback_url } = schema.parse(body);

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

    // Get session details to determine amount
    const sessionDetails = await SessionManager.getSessionForAdmin(
      session.sessionId,
    );

    if (!sessionDetails) {
      logger.error("Session not found in database", {
        sessionId: session.sessionId,
      });
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!sessionDetails.dataLayerSelected) {
      logger.error("Data layer not selected", { sessionId: session.sessionId });
      return NextResponse.json(
        {
          error:
            "Session not ready for payment. Please select data layer first.",
        },
        { status: 400 },
      );
    }

    // Get amount based on data layer
    const { DataLayerFilter } = await import("@/lib/data-layer-filter");
    const layerInfo = DataLayerFilter.getLayerDescription(
      sessionDetails.dataLayerSelected,
    );
    const amountInKobo = layerInfo.price; // Already in kobo

    // Generate payment reference
    const paymentReference = `VN_${session.sessionId}_${nanoid(8)}`;

    // Initialize Paystack payment
    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email:
            email || `${session.phoneNumber.replace("+", "")}@verifynin.ng`,
          amount: amountInKobo,
          reference: paymentReference,
          callback_url:
            callback_url ||
            `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/verification/callback`,
          metadata: {
            sessionId: session.sessionId,
            phoneNumber: session.phoneNumber,
            ninMasked: sessionDetails.ninMasked,
            dataLayer: sessionDetails.dataLayerSelected,
          },
          channels: [
            "card",
            "bank",
            "ussd",
            "qr",
            "mobile_money",
            "bank_transfer",
          ],
        }),
      },
    );

    if (!paystackResponse.ok) {
      const error = await paystackResponse.json();
      logger.error("Paystack initialization error:", error);
      return NextResponse.json(
        { error: "Payment initialization failed" },
        { status: 502 },
      );
    }

    const paystackData = await paystackResponse.json();

    // Update session with payment reference
    await SessionManager.updateSessionWithPayment(
      session.sessionId,
      paymentReference,
      amountInKobo,
      "pending",
    );

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      accessCode: paystackData.data.access_code,
      reference: paymentReference,
      amount: amountInKobo,
      amountDisplay: (amountInKobo / 100).toFixed(2),
      currency: "NGN",
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: email || `${session.phoneNumber.replace("+", "")}@verifynin.ng`,
    });
  } catch (error) {
    logger.error("Payment initialization error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
