import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { walletTransactions, wallets } from "@/db/schema";
import { verifyPaystackSignature } from "@/lib/paystack";
import { eq, sql } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit-log";

import { logger } from "../../../../lib/security/secure-logger";
export const runtime = "nodejs";

async function updateWalletWithRetry(
  reference: string,
  amount: number,
  retries = 3,
) {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      logger.info(
        `[WEBHOOK] Update attempt ${i + 1}/${retries + 1} for reference:`,
        { reference },
      );

      // Find transaction (no transaction wrapper - neon-http doesn't support it)
      const txn = await db.query.walletTransactions.findFirst({
        where: (table, { eq }) => eq(table.reference, reference),
      });

      if (!txn) {
        logger.error("[WEBHOOK] Transaction not found for reference:", {
          error: reference,
        });
        throw new Error(`Transaction not found: ${reference}`);
      }

      logger.info("[WEBHOOK] Found transaction:", {
        value: {
          id: txn.id,
          userId: txn.userId,
          status: txn.status,
          amount: txn.amount,
        },
      });

      if (txn.status === "completed") {
        logger.info("[WEBHOOK] Transaction already completed. Skipping.");
        return;
      }

      logger.info("[WEBHOOK] Updating transaction status to completed");
      await db
        .update(walletTransactions)
        .set({ status: "completed" })
        .where(eq(walletTransactions.id, txn.id));

      logger.info("[WEBHOOK] Updating wallet balance for user:", {
        value: txn.userId,
      });
      const updateResult = await db
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${amount}`,
          updatedAt: sql`now()`,
        })
        .where(eq(wallets.userId, txn.userId))
        .returning();

      if (updateResult.length === 0) {
        logger.error("[WEBHOOK] Wallet not found for user:", {
          error: txn.userId,
        });
        throw new Error(`Wallet not found for user: ${txn.userId}`);
      }

      logger.info("[WEBHOOK] Wallet updated. New balance:", {
        value: updateResult[0].balance,
      });
      logger.info(`[WEBHOOK] Update successful on attempt ${i + 1}`);
      return;
    } catch (error) {
      lastError = error;
      logger.error(`[WEBHOOK] Update attempt ${i + 1} failed:`, error);

      if (i < retries) {
        const delay = Math.pow(2, i) * 100;
        logger.info(`[WEBHOOK] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  logger.error("[WEBHOOK] All retry attempts exhausted");
  throw lastError;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  logger.info("[WEBHOOK] Received webhook request");
  logger.info("[WEBHOOK] Signature present:", { value: !!signature });

  // Log webhook received
  await logAuditEvent({
    timestamp: new Date().toISOString(),
    eventType: "webhook.received",
    ipAddress:
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined,
    resource: "webhook",
    action: "received",
    status: "pending",
    metadata: { hasSignature: !!signature },
  });

  if (!verifyPaystackSignature(rawBody, signature)) {
    logger.error("[WEBHOOK] Invalid signature. Rejecting request.");

    // Log failed webhook
    await logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: "webhook.failed",
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined,
      resource: "webhook",
      action: "signature_verification",
      status: "failure",
      errorMessage: "Invalid signature",
    });

    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  logger.info("[WEBHOOK] Signature verified successfully");

  const event = JSON.parse(rawBody);
  logger.info("[WEBHOOK] Event type:", { value: event.event });
  logger.info("[WEBHOOK] Event data:", {
    value: {
      reference: event.data?.reference,
      amount: event.data?.amount,
      status: event.data?.status,
      customer: event.data?.customer?.email,
    },
  });

  if (event.event !== "charge.success") {
    logger.info("[WEBHOOK] Ignoring non-charge.success event:", {
      value: event.event,
    });
    return NextResponse.json({ received: true });
  }

  const reference = event.data?.reference as string | undefined;
  const amount = event.data?.amount as number | undefined;

  if (!reference || !amount) {
    logger.error("[WEBHOOK] Invalid payload - missing reference or amount");
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  logger.info("[WEBHOOK] Processing charge.success for reference:", {
    reference,
    amount,
  });

  try {
    await updateWalletWithRetry(reference, amount);
    logger.info("[WEBHOOK] Wallet update completed successfully");

    // Log successful webhook processing
    await logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: "webhook.processed",
      resource: "webhook",
      action: "charge_success",
      status: "success",
      metadata: { reference, amount },
    });

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    logger.error("[WEBHOOK] Wallet update failed:", { error: error });
    logger.error("[WEBHOOK] Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
    });

    // Log failed webhook
    await logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: "webhook.failed",
      resource: "webhook",
      action: "wallet_update",
      status: "failure",
      errorMessage: error instanceof Error ? error.message : String(error),
      metadata: { reference, amount },
    });

    return NextResponse.json(
      {
        message: "Failed to update wallet",
        error: String(error),
      },
      { status: 500 },
    );
  }
}
