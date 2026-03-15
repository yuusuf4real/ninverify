import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { walletTransactions, wallets, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit-log";
import { nanoid } from "nanoid";

import { logger } from "../../../../../lib/security/secure-logger";
export const runtime = "nodejs";

const reconcileSchema = z.object({
  reference: z.string().min(1, "Payment reference is required"),
  userId: z.string().min(1, "User ID is required"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional().default("Manual reconciliation"),
});

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getSession();
    if (
      !session ||
      (session.role !== "admin" && session.role !== "super_admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = reconcileSchema.parse(body);

    // Check if user exists
    const [user] = await db
      .select({ id: users.id, email: users.email, fullName: users.fullName })
      .from(users)
      .where(eq(users.id, data.userId));

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if transaction with this reference already exists
    const [existingTransaction] = await db
      .select({ id: walletTransactions.id })
      .from(walletTransactions)
      .where(eq(walletTransactions.reference, data.reference));

    if (existingTransaction) {
      return NextResponse.json(
        {
          error: "Transaction with this reference already exists",
        },
        { status: 400 },
      );
    }

    // Get user's wallet
    const [wallet] = await db
      .select({ id: wallets.id, balance: wallets.balance })
      .from(wallets)
      .where(eq(wallets.userId, data.userId));

    if (!wallet) {
      return NextResponse.json(
        { error: "User wallet not found" },
        { status: 404 },
      );
    }

    // Create the reconciliation transaction
    const transactionId = nanoid();
    await db.insert(walletTransactions).values({
      id: transactionId,
      userId: data.userId,
      type: "credit",
      amount: data.amount,
      status: "completed",
      description: data.description,
      reference: data.reference,
      provider: "manual_reconciliation",
      metadata: {
        reconciledBy: session.userId,
        reconciledAt: new Date().toISOString(),
        method: "manual_reconciliation",
      },
    });

    // Update wallet balance
    await db
      .update(wallets)
      .set({ balance: wallet.balance + data.amount })
      .where(eq(wallets.id, wallet.id));

    // Log admin action
    await logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: "wallet.funded", // Using existing event type
      userId: session.userId,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      resource: "transaction",
      action: "reconcile",
      status: "success",
      metadata: {
        transactionId,
        targetUserId: data.userId,
        targetUserEmail: user.email,
        amount: data.amount,
        reference: data.reference,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment reconciled successfully",
      transaction: {
        id: transactionId,
        amount: data.amount,
        reference: data.reference,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        },
      },
    });
  } catch (error) {
    logger.error("Transaction reconciliation error:", error);

    // Log error
    const session = await getSession();
    if (session) {
      await logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: "api.error",
        userId: session.userId,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        resource: "transaction",
        action: "reconcile",
        status: "failure",
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }

    return NextResponse.json(
      { error: "Failed to reconcile payment" },
      { status: 500 },
    );
  }
}
