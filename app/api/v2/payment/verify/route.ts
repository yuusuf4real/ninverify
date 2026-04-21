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

    const { paymentReference } = await request.json();

    if (!paymentReference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 },
      );
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${paymentReference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    const paymentData = await paystackResponse.json();

    if (!paystackResponse.ok || !paymentData.status) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 },
      );
    }

    const { data } = paymentData;

    // Check if payment was successful
    if (data.status !== "success") {
      return NextResponse.json({
        success: false,
        status: data.status,
        message: "Payment was not successful",
      });
    }

    // Verify the payment belongs to this session
    const sessionId = data.metadata?.sessionId;
    if (sessionId !== session.sessionId) {
      return NextResponse.json(
        { error: "Payment does not belong to this session" },
        { status: 400 },
      );
    }

    // Update session with payment completion
    await SessionManager.updateSessionWithPayment(
      session.sessionId,
      paymentReference,
      data.amount,
      "completed",
    );

    return NextResponse.json({
      success: true,
      status: "completed",
      amount: data.amount,
      reference: paymentReference,
      message: "Payment verified successfully. Processing verification...",
    });
  } catch (error) {
    logger.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
