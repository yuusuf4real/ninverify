import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { walletTransactions, wallets } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { verifyPaystackPayment } from "@/lib/paystack";
import { logPaymentEvent, logAPIError } from "@/lib/audit-log";

import { logger } from "../../../../lib/security/secure-logger";
export const runtime = "nodejs";

/**
 * Check for pending payments that may have been missed
 * This endpoint allows users to self-service reconcile payments
 * that were successful on Paystack but didn't update their wallet
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  logger.info("[CHECK-PENDING] Starting check for user:", {
    value: session.userId,
  });

  try {
    const body = await request.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json(
        { message: "Payment reference is required" },
        { status: 400 },
      );
    }

    logger.info("[CHECK-PENDING] Checking reference:", { value: reference });

    // Check if transaction already exists in our database
    const existingTx = await db.query.walletTransactions.findFirst({
      where: (transactions, { eq }) => eq(transactions.reference, reference),
    });

    if (existingTx) {
      logger.info("[CHECK-PENDING] Transaction found:", {
        value: {
          status: existingTx.status,
          amount: existingTx.amount,
        },
      });

      if (existingTx.status === "completed") {
        return NextResponse.json({
          message: "Payment already processed",
          status: "completed",
          amount: existingTx.amount,
        });
      }

      // Transaction exists but not completed - verify with Paystack
      logger.info(
        "[CHECK-PENDING] Transaction pending, verifying with Paystack...",
      );
    } else {
      logger.info(
        "[CHECK-PENDING] Transaction not found in database, checking Paystack...",
      );
    }

    // Verify payment status with Paystack
    const paystackData = await verifyPaystackPayment(reference);

    if (!paystackData.status || !paystackData.data) {
      throw new Error("Invalid response from Paystack");
    }

    const txData = paystackData.data;

    // Check if payment belongs to this user
    if (txData.customer?.email !== session.email) {
      logger.error("[CHECK-PENDING] Payment belongs to different user");
      return NextResponse.json(
        { message: "Payment not found or does not belong to you" },
        { status: 404 },
      );
    }

    if (txData.status !== "success") {
      logger.info("[CHECK-PENDING] Payment not successful on Paystack:", {
        value: txData.status,
      });
      return NextResponse.json({
        message: "Payment was not successful",
        status: txData.status,
        reference,
      });
    }

    const amountInKobo = txData.amount;
    logger.info("[CHECK-PENDING] Payment successful on Paystack. Amount:", {
      value: amountInKobo,
    });

    // Get user's wallet
    const wallet = await db.query.wallets.findFirst({
      where: (wallets, { eq }) => eq(wallets.userId, session.userId),
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (existingTx) {
      // Update existing pending transaction
      logger.info("[CHECK-PENDING] Updating existing transaction to completed");

      await db
        .update(walletTransactions)
        .set({
          status: "completed",
          amount: amountInKobo, // Update amount in case it was wrong
        })
        .where(eq(walletTransactions.id, existingTx.id));
    } else {
      // Create new transaction record
      logger.info("[CHECK-PENDING] Creating new transaction record");

      await db.insert(walletTransactions).values({
        id: reference,
        userId: session.userId,
        type: "credit",
        status: "completed",
        amount: amountInKobo,
        provider: "paystack",
        reference: reference,
        description: "Wallet funding via Paystack (recovered)",
        metadata: { recovered: true, recoveredAt: new Date().toISOString() },
      });
    }

    // Update wallet balance
    logger.info("[CHECK-PENDING] Updating wallet balance");

    const updatedWallet = await db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${amountInKobo}`,
        updatedAt: sql`now()`,
      })
      .where(eq(wallets.id, wallet.id))
      .returning();

    logger.info("[CHECK-PENDING] Wallet updated. New balance:", {
      value: updatedWallet[0].balance,
    });

    // Log successful recovery
    await logPaymentEvent(
      "payment.success",
      session.userId,
      amountInKobo,
      reference,
      "success",
      { recovered: true, method: "user_self_service" },
    );

    return NextResponse.json({
      message: "Payment recovered successfully",
      reference,
      amount: amountInKobo,
      newBalance: updatedWallet[0].balance,
      recovered: true,
    });
  } catch (error) {
    logger.error("[CHECK-PENDING] Error:", { error: error });

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logAPIError(
      "/api/wallet/check-pending-payments",
      error,
      session.userId,
    );

    return NextResponse.json(
      {
        message: "Failed to check payment status",
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
