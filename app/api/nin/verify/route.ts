import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { db } from "@/db/client";
import { ninVerifications, walletTransactions, wallets } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { isValidNin, maskNin, normalizeNin } from "@/lib/nin";
import { verifyNinWithYouVerify } from "@/lib/youverify";
import { getFriendlyErrorMessage } from "@/lib/utils";
import { eq, sql } from "drizzle-orm";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { logNINVerification, logAPIError } from "@/lib/audit-log";

export const runtime = "nodejs";

const schema = z.object({
  nin: z.string(),
  consent: z.boolean()
});

const VERIFICATION_FEE = 50000; // kobo

async function queryWithRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
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
    `nin-verify:${session.userId}`,
    RATE_LIMITS.ninVerify,
    "/api/nin/verify"
  );
  
  if (rateLimitResult) {
    return NextResponse.json(
      { message: rateLimitResult.message },
      { 
        status: rateLimitResult.status,
        headers: { "Retry-After": String(rateLimitResult.retryAfter) }
      }
    );
  }

  console.log("[NIN] Verification request from user:", session.userId);

  try {
    const body = await request.json();
    const { nin, consent } = schema.parse(body);

    if (!consent) {
      console.log("[NIN] Consent not provided");
      return NextResponse.json(
        { message: "Consent is required for NIN verification" },
        { status: 400 }
      );
    }

    const cleanNin = normalizeNin(nin);
    if (!isValidNin(cleanNin)) {
      console.log("[NIN] Invalid NIN format:", cleanNin.length, "digits");
      return NextResponse.json(
        { message: "Please enter a valid 11-digit NIN" },
        { status: 400 }
      );
    }

    const masked = maskNin(cleanNin);

    console.log("[NIN] Processing NIN:", masked);

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentVerification = await db.query.ninVerifications.findFirst({
      where: (table, { and, eq, gte }) =>
        and(
          eq(table.userId, session.userId),
          eq(table.ninMasked, masked),
          eq(table.status, "success"),
          gte(table.createdAt, tenMinutesAgo)
        ),
      orderBy: (table, { desc }) => [desc(table.createdAt)]
    });

    if (recentVerification) {
      return NextResponse.json({
        status: "success",
        verificationId: recentVerification.id,
        data: {
          fullName: recentVerification.fullName,
          dateOfBirth: recentVerification.dateOfBirth,
          phone: recentVerification.phone
        },
        cached: true
      });
    }

    console.log("[NIN] Checking wallet balance...");
    const wallet = await queryWithRetry(() =>
      db.query.wallets.findFirst({
        where: (wallets, { eq }) => eq(wallets.userId, session.userId)
      })
    );

    if (!wallet || wallet.balance < VERIFICATION_FEE) {
      console.log("[NIN] Insufficient balance. Current:", wallet?.balance, "Required:", VERIFICATION_FEE);
      return NextResponse.json(
        { message: "Insufficient wallet balance" },
        { status: 402 }
      );
    }

    const verificationId = nanoid();
    const debitId = nanoid();

    console.log("[NIN] Creating verification record and debiting wallet...");
    
    // Log verification initiated
    await logNINVerification(
      "nin.verification.initiated",
      session.userId,
      masked,
      "pending",
      { verificationId, amount: VERIFICATION_FEE }
    );
    
    // Create verification record (no transaction - neon-http doesn't support it)
    await queryWithRetry(() =>
      db.insert(ninVerifications).values({
        id: verificationId,
        userId: session.userId,
        ninMasked: masked,
        consent,
        status: "pending"
      })
    );

    // Create debit transaction
    await queryWithRetry(() =>
      db.insert(walletTransactions).values({
        id: debitId,
        userId: session.userId,
        type: "debit",
        status: "pending",
        amount: VERIFICATION_FEE,
        provider: "wallet",
        description: "NIN verification",
        ninMasked: masked
      })
    );

    // Debit wallet
    await queryWithRetry(() =>
      db
        .update(wallets)
        .set({ 
          balance: sql`${wallets.balance} - ${VERIFICATION_FEE}`,
          updatedAt: sql`now()`
        })
        .where(eq(wallets.id, wallet.id))
    );

    console.log("[NIN] Wallet debited. Calling YouVerify API...");

    let response;
    try {
      response = await verifyNinWithYouVerify(cleanNin);
      console.log("[NIN] YouVerify response:", JSON.stringify(response, null, 2));
    } catch (error) {
      console.error("[NIN] YouVerify API error:", error);
      console.error("[NIN] Error details:", {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error)
      });
      
      // Check if it's a rate limit error
      const errorMessage = error instanceof Error ? error.message : String(error);
      const providerStatus =
        error instanceof Error && "statusCode" in error
          ? (error as Error & { statusCode?: number }).statusCode
          : undefined;
      const isRateLimit =
        providerStatus === 429 ||
        errorMessage.includes("Too many requests") ||
        errorMessage.includes("10 minutes");
      const isInsufficientFunds =
        providerStatus === 402 ||
        errorMessage.includes("insufficient funds") ||
        errorMessage.includes("Insufficient fund");
      const isForbidden =
        providerStatus === 403 || errorMessage.toLowerCase().includes("forbidden");
      const isUnauthorized =
        providerStatus === 401 || errorMessage.toLowerCase().includes("unauthorized");
      
      // Log failed verification
      await logNINVerification(
        "nin.verification.failed",
        session.userId,
        masked,
        "failure",
        { 
          verificationId, 
          reason: isRateLimit ? "Rate limit exceeded" : isInsufficientFunds ? "Provider insufficient funds" : "Provider error",
          error: errorMessage
        }
      );
      
      // Refund the wallet
      try {
        await handleRefund({
          verificationId,
          debitId,
          userId: session.userId,
          walletId: wallet.id,
          masked,
          reason: isRateLimit ? "Rate limit exceeded" : isInsufficientFunds ? "Provider service unavailable" : "Verification provider error"
        });
        console.log("[NIN] Refund completed after API error");
      } catch (refundError) {
        console.error("[NIN] Refund failed:", refundError);
        await logAPIError("/api/nin/verify", refundError, session.userId, {
          context: "refund_failed",
          verificationId
        });
      }
      
      // Provide user-friendly message
      if (isInsufficientFunds) {
        return NextResponse.json({ 
          message: "The verification service is temporarily unavailable. Your wallet has been refunded. Please try again later or contact support."
        }, { status: 503 });
      }
      
      if (isRateLimit) {
        return NextResponse.json({ 
          message: "This NIN was recently verified. Please wait 10 minutes before trying again. Your wallet has been refunded."
        }, { status: 429 });
      }

      if (isForbidden || isUnauthorized) {
        return NextResponse.json(
          {
            message:
              "Verification provider rejected this request. If you are testing in sandbox, use the allowed test NIN and try again, or switch to a production token."
          },
          { status: 403 }
        );
      }
      
      const message = getFriendlyErrorMessage(
        error,
        "We couldn't reach the verification provider. Your wallet has been refunded."
      );
      return NextResponse.json({ message }, { status: 502 });
    }

    const status = response.data?.status?.toLowerCase();
    const details = response.data;

    console.log("[NIN] Verification check - Status:", status, "Has details:", !!details);

    if (status === "found" && details) {
      const fullName = [details.firstName, details.middleName, details.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      console.log("[NIN] NIN found. Updating verification record...");
      
      await db
        .update(ninVerifications)
        .set({
          status: "success",
          fullName: fullName || null,
          dateOfBirth: details.dateOfBirth || null,
          phone: details.mobile || null,
          providerReference: details.id || null,
          rawResponse: response as unknown as Record<string, unknown>
        })
        .where(eq(ninVerifications.id, verificationId));

      await db
        .update(walletTransactions)
        .set({ status: "completed" })
        .where(eq(walletTransactions.id, debitId));

      // Log successful verification
      await logNINVerification(
        "nin.verification.success",
        session.userId,
        masked,
        "success",
        { verificationId, fullName }
      );

      console.log("[NIN] Verification successful");
      return NextResponse.json({
        status: "success",
        verificationId,
        data: {
          fullName,
          dateOfBirth: details.dateOfBirth,
          phone: details.mobile
        }
      });
    }

    console.log("[NIN] NIN not found - refunding wallet");
    
    // Log failed verification
    await logNINVerification(
      "nin.verification.failed",
      session.userId,
      masked,
      "failure",
      { verificationId, reason: "NIN not found" }
    );
    
    await handleRefund({
      verificationId,
      debitId,
      userId: session.userId,
      walletId: wallet.id,
      masked,
      reason: "NIN not found"
    });

    return NextResponse.json(
      { message: "NIN not found. Wallet refunded." },
      { status: 404 }
    );
  } catch (error) {
    console.error("[NIN] Verification error:", error);
    if (error instanceof Error) {
      console.error("[NIN] Error message:", error.message);
      console.error("[NIN] Error stack:", error.stack);
    }
    
    // Log API error
    await logAPIError("/api/nin/verify", error, session.userId);
    
    const message = getFriendlyErrorMessage(
      error,
      "We couldn't complete the verification. Please try again in a few minutes."
    );
    return NextResponse.json({ message }, { status: 500 });
  }
}

async function handleRefund(params: {
  verificationId: string;
  debitId: string;
  userId: string;
  walletId: string;
  masked: string;
  reason: string;
}) {
  console.log("[NIN] Starting refund process. Reason:", params.reason);
  
  let lastError: unknown;
  for (let i = 0; i <= 2; i++) {
    try {
      console.log(`[NIN] Refund attempt ${i + 1}/3`);
      
      // Update verification status (no transaction - neon-http doesn't support it)
      await db
        .update(ninVerifications)
        .set({ status: "failed", errorMessage: params.reason })
        .where(eq(ninVerifications.id, params.verificationId));

      // Mark debit as refunded
      await db
        .update(walletTransactions)
        .set({ status: "refunded" })
        .where(eq(walletTransactions.id, params.debitId));

      // Create refund transaction
      await db.insert(walletTransactions).values({
        id: nanoid(),
        userId: params.userId,
        type: "refund",
        status: "completed",
        amount: VERIFICATION_FEE,
        provider: "system",
        description: "NIN verification refund",
        ninMasked: params.masked
      });

      // Credit wallet back
      await db
        .update(wallets)
        .set({ 
          balance: sql`${wallets.balance} + ${VERIFICATION_FEE}`,
          updatedAt: sql`now()`
        })
        .where(eq(wallets.id, params.walletId));

      console.log("[NIN] Refund completed successfully");
      return;
    } catch (error) {
      lastError = error;
      console.error(`[NIN] Refund attempt ${i + 1} failed:`, error);
      if (i < 2) {
        const delay = Math.pow(2, i) * 100;
        console.log(`[NIN] Retrying refund in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error("[NIN] Refund failed after all retries:", lastError);
  throw lastError;
}
