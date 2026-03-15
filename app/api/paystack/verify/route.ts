import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { walletTransactions, wallets } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { logPaymentEvent, logAPIError } from "@/lib/audit-log";

import { logger } from "../../../../lib/security/secure-logger";
export const runtime = "nodejs";

async function queryWithRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 100),
        );
      }
    }
  }
  throw lastError;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Apply rate limiting
  const rateLimitResult = rateLimitMiddleware(
    `payment-verify:${session.userId}`,
    RATE_LIMITS.paymentVerify,
    "/api/paystack/verify",
  );

  if (rateLimitResult) {
    return NextResponse.json(
      { message: rateLimitResult.message },
      {
        status: rateLimitResult.status,
        headers: { "Retry-After": String(rateLimitResult.retryAfter) },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json(
      { message: "Payment reference is required" },
      { status: 400 },
    );
  }

  logger.info("[VERIFY] Starting verification for reference:", {
    value: reference,
  });

  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY not configured");
    }

    // Verify payment with Paystack
    logger.info("[VERIFY] Calling Paystack API...");
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    logger.info("[VERIFY] Paystack response status:", {
      value: paystackResponse.status,
    });

    if (!paystackResponse.ok) {
      const errorText = await paystackResponse.text();
      logger.error("[VERIFY] Paystack error response:", { error: errorText });

      await logPaymentEvent(
        "payment.failed",
        session.userId,
        0,
        reference,
        "failure",
        { error: errorText, httpStatus: paystackResponse.status },
      );

      throw new Error(
        `Paystack verification failed: ${paystackResponse.status} - ${errorText}`,
      );
    }

    let paystackData;
    try {
      const responseText = await paystackResponse.text();
      logger.info("[VERIFY] Raw response:", {
        response: responseText.substring(0, 200),
      });
      paystackData = JSON.parse(responseText);
    } catch (parseError) {
      logger.error("[VERIFY] JSON parse error:", { error: parseError });

      await logPaymentEvent(
        "payment.failed",
        session.userId,
        0,
        reference,
        "failure",
        { error: "JSON parse error" },
      );

      throw new Error("Invalid response from payment provider");
    }

    logger.info("[VERIFY] Paystack data:", {
      data: JSON.stringify(paystackData, null, 2),
    });

    if (!paystackData.status || !paystackData.data) {
      throw new Error("Invalid payment verification response");
    }

    const { data: txData } = paystackData;

    if (txData.status !== "success") {
      logger.info("[VERIFY] Payment not successful. Status:", {
        value: txData.status,
      });
      return NextResponse.json(
        { message: "Payment was not successful", reference },
        { status: 400 },
      );
    }

    const amountInKobo = txData.amount;
    logger.info("[VERIFY] Payment successful. Amount:", {
      value: amountInKobo,
    });

    // Check if transaction already exists
    const existingTx = await queryWithRetry(() =>
      db.query.walletTransactions.findFirst({
        where: (transactions, { eq }) => eq(transactions.reference, reference),
      }),
    );

    if (existingTx) {
      logger.info("[VERIFY] Transaction already processed");
      return NextResponse.json({
        message: "Payment already processed",
        reference,
        amount: amountInKobo,
      });
    }

    // Get user's wallet
    const wallet = await queryWithRetry(() =>
      db.query.wallets.findFirst({
        where: (wallets, { eq }) => eq(wallets.userId, session.userId),
      }),
    );

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    logger.info("[VERIFY] Creating transaction record...");

    // Create transaction record (no transaction wrapper - neon-http doesn't support it)
    await queryWithRetry(() =>
      db.insert(walletTransactions).values({
        id: reference,
        userId: session.userId,
        type: "credit",
        status: "completed",
        amount: amountInKobo,
        provider: "paystack",
        reference: reference,
        description: "Wallet funding via Paystack",
      }),
    );

    logger.info("[VERIFY] Updating wallet balance...");

    // Update wallet balance
    await queryWithRetry(() =>
      db
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${amountInKobo}`,
          updatedAt: sql`now()`,
        })
        .where(eq(wallets.id, wallet.id)),
    );

    logger.info("[VERIFY] Verification completed successfully");

    // Log successful payment
    await logPaymentEvent(
      "payment.success",
      session.userId,
      amountInKobo,
      reference,
      "success",
    );

    return NextResponse.json({
      message: "Payment verified and wallet updated",
      reference,
      amount: amountInKobo,
    });
  } catch (error) {
    logger.error("[VERIFY] Verification error:", { error: error });

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("[VERIFY] Error details:", {
      error: {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      },
    });

    // Log API error
    await logAPIError("/api/paystack/verify", error, session.userId, {
      reference,
    });

    return NextResponse.json(
      {
        message: "Failed to update wallet",
        error: errorMessage,
        reference,
      },
      { status: 500 },
    );
  }
}
