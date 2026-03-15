import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "@/db/client";
import { walletTransactions } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { initializePaystackPayment } from "@/lib/paystack";
import { getFriendlyErrorMessage } from "@/lib/utils";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { logPaymentEvent, logAPIError } from "@/lib/audit-log";

import { logger } from "../../../../lib/security/secure-logger";
export const runtime = "nodejs";

const schema = z.object({
  amount: z.number().min(500),
});

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

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Apply rate limiting
  const rateLimitResult = rateLimitMiddleware(
    `payment-init:${session.userId}`,
    RATE_LIMITS.paymentInitialize,
    "/api/paystack/initialize",
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

  try {
    const body = await request.json();
    const { amount } = schema.parse(body);
    const amountKobo = amount * 100;
    const reference = `jv_${nanoid(10)}`;

    logger.info("Initializing payment. User:", {
      userId: session.userId,
      amount: amountKobo,
      reference,
    });

    // Verify wallet exists
    const wallet = await queryWithRetry(() =>
      db.query.wallets.findFirst({
        where: (wallets, { eq }) => eq(wallets.userId, session.userId),
      }),
    );

    if (!wallet) {
      logger.error("Wallet not found for user:", { error: session.userId });
      return NextResponse.json(
        { message: "Wallet not found. Please try logging out and back in." },
        { status: 404 },
      );
    }

    logger.info("Wallet found. Creating transaction record...");

    await queryWithRetry(() =>
      db.insert(walletTransactions).values({
        id: nanoid(),
        userId: session.userId,
        type: "credit",
        status: "pending",
        amount: amountKobo,
        provider: "paystack",
        reference,
        description: "Wallet funding",
      }),
    );

    logger.info("Transaction record created. Initializing Paystack...");

    const init = await initializePaystackPayment(session.email, amountKobo, {
      userId: session.userId,
      reference,
    });

    // Log payment initialization
    await logPaymentEvent(
      "payment.initialized",
      session.userId,
      amountKobo,
      reference,
      "pending",
      { email: session.email },
    );

    logger.info("Paystack initialized. Access code:", {
      value: init.data.access_code,
    });

    return NextResponse.json({
      accessCode: init.data.access_code,
      reference: init.data.reference,
    });
  } catch (error) {
    logger.error("Paystack initialization error:", { error: error });

    // Log error
    await logAPIError("/api/paystack/initialize", error, session.userId);

    const message = getFriendlyErrorMessage(
      error,
      "We couldn't start the payment. Please try again in a few minutes.",
    );
    return NextResponse.json({ message }, { status: 500 });
  }
}
