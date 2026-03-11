import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { walletTransactions, wallets } from "@/db/schema";
import { verifyPaystackSignature } from "@/lib/paystack";
import { eq, sql } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit-log";

export const runtime = "nodejs";

async function updateWalletWithRetry(reference: string, amount: number, retries = 3) {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      console.log(`[WEBHOOK] Update attempt ${i + 1}/${retries + 1} for reference:`, reference);
      
      // Find transaction (no transaction wrapper - neon-http doesn't support it)
      const txn = await db.query.walletTransactions.findFirst({
        where: (table, { eq }) => eq(table.reference, reference)
      });

      if (!txn) {
        console.error("[WEBHOOK] Transaction not found for reference:", reference);
        throw new Error(`Transaction not found: ${reference}`);
      }

      console.log("[WEBHOOK] Found transaction:", {
        id: txn.id,
        userId: txn.userId,
        status: txn.status,
        amount: txn.amount
      });

      if (txn.status === "completed") {
        console.log("[WEBHOOK] Transaction already completed. Skipping.");
        return;
      }

      console.log("[WEBHOOK] Updating transaction status to completed");
      await db
        .update(walletTransactions)
        .set({ status: "completed" })
        .where(eq(walletTransactions.id, txn.id));

      console.log("[WEBHOOK] Updating wallet balance for user:", txn.userId);
      const updateResult = await db
        .update(wallets)
        .set({ 
          balance: sql`${wallets.balance} + ${amount}`,
          updatedAt: sql`now()`
        })
        .where(eq(wallets.userId, txn.userId))
        .returning();

      if (updateResult.length === 0) {
        console.error("[WEBHOOK] Wallet not found for user:", txn.userId);
        throw new Error(`Wallet not found for user: ${txn.userId}`);
      }

      console.log("[WEBHOOK] Wallet updated. New balance:", updateResult[0].balance);
      console.log(`[WEBHOOK] Update successful on attempt ${i + 1}`);
      return;
    } catch (error) {
      lastError = error;
      console.error(`[WEBHOOK] Update attempt ${i + 1} failed:`, error);
      
      if (i < retries) {
        const delay = Math.pow(2, i) * 100;
        console.log(`[WEBHOOK] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error("[WEBHOOK] All retry attempts exhausted");
  throw lastError;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  console.log("[WEBHOOK] Received webhook request");
  console.log("[WEBHOOK] Signature present:", !!signature);

  // Log webhook received
  await logAuditEvent({
    timestamp: new Date().toISOString(),
    eventType: "webhook.received",
    ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    resource: "webhook",
    action: "received",
    status: "pending",
    metadata: { hasSignature: !!signature }
  });

  if (!verifyPaystackSignature(rawBody, signature)) {
    console.error("[WEBHOOK] Invalid signature. Rejecting request.");
    
    // Log failed webhook
    await logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: "webhook.failed",
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      resource: "webhook",
      action: "signature_verification",
      status: "failure",
      errorMessage: "Invalid signature"
    });
    
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  console.log("[WEBHOOK] Signature verified successfully");

  const event = JSON.parse(rawBody);
  console.log("[WEBHOOK] Event type:", event.event);
  console.log("[WEBHOOK] Event data:", {
    reference: event.data?.reference,
    amount: event.data?.amount,
    status: event.data?.status,
    customer: event.data?.customer?.email
  });

  if (event.event !== "charge.success") {
    console.log("[WEBHOOK] Ignoring non-charge.success event:", event.event);
    return NextResponse.json({ received: true });
  }

  const reference = event.data?.reference as string | undefined;
  const amount = event.data?.amount as number | undefined;

  if (!reference || !amount) {
    console.error("[WEBHOOK] Invalid payload - missing reference or amount");
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  console.log("[WEBHOOK] Processing charge.success for reference:", reference, "Amount:", amount);

  try {
    await updateWalletWithRetry(reference, amount);
    console.log("[WEBHOOK] Wallet update completed successfully");
    
    // Log successful webhook processing
    await logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: "webhook.processed",
      resource: "webhook",
      action: "charge_success",
      status: "success",
      metadata: { reference, amount }
    });
    
    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error("[WEBHOOK] Wallet update failed:", error);
    console.error("[WEBHOOK] Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error)
    });
    
    // Log failed webhook
    await logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: "webhook.failed",
      resource: "webhook",
      action: "wallet_update",
      status: "failure",
      errorMessage: error instanceof Error ? error.message : String(error),
      metadata: { reference, amount }
    });
    
    return NextResponse.json({ 
      message: "Failed to update wallet", 
      error: String(error) 
    }, { status: 500 });
  }
}
