import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { walletTransactions, wallets } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { verifyPaystackPayment } from "@/lib/paystack";
import { logPaymentEvent, logAPIError } from "@/lib/audit-log";

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

  console.log("[CHECK-PENDING] Starting check for user:", session.userId);

  try {
    const body = await request.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json(
        { message: "Payment reference is required" },
        { status: 400 }
      );
    }

    console.log("[CHECK-PENDING] Checking reference:", reference);

    // Check if transaction already exists in our database
    const existingTx = await db.query.walletTransactions.findFirst({
      where: (transactions, { eq }) => eq(transactions.reference, reference)
    });

    if (existingTx) {
      console.log("[CHECK-PENDING] Transaction found:", {
        status: existingTx.status,
        amount: existingTx.amount
      });

      if (existingTx.status === "completed") {
        return NextResponse.json({
          message: "Payment already processed",
          status: "completed",
          amount: existingTx.amount
        });
      }

      // Transaction exists but not completed - verify with Paystack
      console.log("[CHECK-PENDING] Transaction pending, verifying with Paystack...");
    } else {
      console.log("[CHECK-PENDING] Transaction not found in database, checking Paystack...");
    }

    // Verify payment status with Paystack
    const paystackData = await verifyPaystackPayment(reference);

    if (!paystackData.status || !paystackData.data) {
      throw new Error("Invalid response from Paystack");
    }

    const txData = paystackData.data;

    // Check if payment belongs to this user
    if (txData.customer?.email !== session.email) {
      console.error("[CHECK-PENDING] Payment belongs to different user");
      return NextResponse.json(
        { message: "Payment not found or does not belong to you" },
        { status: 404 }
      );
    }

    if (txData.status !== "success") {
      console.log("[CHECK-PENDING] Payment not successful on Paystack:", txData.status);
      return NextResponse.json({
        message: "Payment was not successful",
        status: txData.status,
        reference
      });
    }

    const amountInKobo = txData.amount;
    console.log("[CHECK-PENDING] Payment successful on Paystack. Amount:", amountInKobo);

    // Get user's wallet
    const wallet = await db.query.wallets.findFirst({
      where: (wallets, { eq }) => eq(wallets.userId, session.userId)
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (existingTx) {
      // Update existing pending transaction
      console.log("[CHECK-PENDING] Updating existing transaction to completed");
      
      await db
        .update(walletTransactions)
        .set({ 
          status: "completed",
          amount: amountInKobo // Update amount in case it was wrong
        })
        .where(eq(walletTransactions.id, existingTx.id));
    } else {
      // Create new transaction record
      console.log("[CHECK-PENDING] Creating new transaction record");
      
      await db.insert(walletTransactions).values({
        id: reference,
        userId: session.userId,
        type: "credit",
        status: "completed",
        amount: amountInKobo,
        provider: "paystack",
        reference: reference,
        description: "Wallet funding via Paystack (recovered)",
        metadata: { recovered: true, recoveredAt: new Date().toISOString() }
      });
    }

    // Update wallet balance
    console.log("[CHECK-PENDING] Updating wallet balance");
    
    const updatedWallet = await db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${amountInKobo}`,
        updatedAt: sql`now()`
      })
      .where(eq(wallets.id, wallet.id))
      .returning();

    console.log("[CHECK-PENDING] Wallet updated. New balance:", updatedWallet[0].balance);

    // Log successful recovery
    await logPaymentEvent(
      "payment.success",
      session.userId,
      amountInKobo,
      reference,
      "success",
      { recovered: true, method: "user_self_service" }
    );

    return NextResponse.json({
      message: "Payment recovered successfully",
      reference,
      amount: amountInKobo,
      newBalance: updatedWallet[0].balance,
      recovered: true
    });
  } catch (error) {
    console.error("[CHECK-PENDING] Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    await logAPIError("/api/wallet/check-pending-payments", error, session.userId);

    return NextResponse.json(
      {
        message: "Failed to check payment status",
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
