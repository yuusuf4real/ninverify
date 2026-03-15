import crypto from "crypto";

import { logger } from "./security/secure-logger";
/**
 * Verify Paystack webhook signature using HMAC SHA-512
 *
 * SECURITY: This is critical for production - prevents webhook spoofing attacks
 * Paystack signs all webhook requests with your secret key
 *
 * @see https://paystack.com/docs/payments/webhooks/#verify-signature
 * @param payload - Raw request body as string
 * @param signature - x-paystack-signature header value
 * @returns boolean indicating if signature is valid
 */
export function verifyPaystackSignature(
  payload: string,
  signature: string | null,
): boolean {
  if (!signature) {
    logger.error("[PAYSTACK] No signature provided in webhook request");
    return false;
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    logger.error("[PAYSTACK] PAYSTACK_SECRET_KEY environment variable not set");
    throw new Error("Paystack secret key not configured");
  }

  try {
    // Compute HMAC SHA-512 hash of the payload
    const hash = crypto
      .createHmac("sha512", secret)
      .update(payload)
      .digest("hex");

    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(signature),
    );

    if (!isValid) {
      logger.error("[PAYSTACK] Signature mismatch");
      logger.error(
        "[PAYSTACK] Expected (first 20 chars):",
        hash.substring(0, 20),
      );
      logger.error(
        "[PAYSTACK] Received (first 20 chars):",
        signature.substring(0, 20),
      );
    } else {
      logger.info("[PAYSTACK] Signature verified successfully");
    }

    return isValid;
  } catch (error) {
    logger.error("[PAYSTACK] Error during signature verification:", {
      error: error,
    });
    return false;
  }
}

/**
 * Verify payment transaction with Paystack API
 *
 * IMPORTANT: Always verify payments server-side, never trust client-side data
 * This prevents users from manipulating payment amounts or statuses
 *
 * @param reference - Transaction reference from Paystack
 * @returns Payment verification data
 */
export async function verifyPaystackPayment(reference: string) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY not configured");
  }

  logger.info("[PAYSTACK] Verifying payment for reference:", {
    value: reference,
  });

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(15000), // 15 seconds
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("[PAYSTACK] Verification failed:", {
        error: response.status,
        errorText,
      });
      throw new Error(`Paystack API error: ${response.status}`);
    }

    const data = await response.json();
    logger.info("[PAYSTACK] Verification response:", {
      value: {
        status: data.status,
        reference: data.data?.reference,
        amount: data.data?.amount,
        transactionStatus: data.data?.status,
      },
    });

    return data;
  } catch (error) {
    logger.error("[PAYSTACK] Payment verification error:", { error: error });
    throw error;
  }
}

/**
 * Initialize Paystack payment
 *
 * @param email - Customer email
 * @param amount - Amount in kobo (smallest currency unit)
 * @param metadata - Additional transaction metadata
 * @returns Initialization response with access code
 */
export async function initializePaystackPayment(
  email: string,
  amount: number,
  metadata?: Record<string, unknown>,
) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY not configured");
  }

  // Validate amount (minimum ₦50 = 5000 kobo)
  if (amount < 5000) {
    throw new Error("Amount must be at least ₦50");
  }

  // Validate amount (maximum ₦1,000,000 = 100,000,000 kobo for safety)
  const maxAmount = parseInt(
    process.env.MAX_WALLET_FUNDING_AMOUNT || "100000000",
  );
  if (amount > maxAmount) {
    throw new Error(`Amount exceeds maximum limit of ₦${maxAmount / 100}`);
  }

  logger.info("[PAYSTACK] Initializing payment:", {
    value: { email, amount, metadata },
  });

  try {
    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount,
          currency: "NGN",
          metadata: {
            ...metadata,
            custom_fields: [
              {
                display_name: "Service",
                variable_name: "service",
                value: "NIN Verification",
              },
            ],
          },
        }),
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("[PAYSTACK] Initialization failed:", {
        error: response.status,
        errorText,
      });
      throw new Error(`Paystack API error: ${response.status}`);
    }

    const data = await response.json();
    logger.info("[PAYSTACK] Payment initialized:", {
      value: {
        reference: data.data?.reference,
        accessCode: data.data?.access_code ? "present" : "missing",
      },
    });

    return data;
  } catch (error) {
    logger.error("[PAYSTACK] Payment initialization error:", { error: error });
    throw error;
  }
}
