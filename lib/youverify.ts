import { logger } from "./security/secure-logger";

const DEFAULT_BASE = "https://api.youverify.co"; // Production URL (base)

function getYouVerifyToken() {
  const token = process.env.YOUVERIFY_TOKEN;
  if (!token) {
    throw new Error("YOUVERIFY_TOKEN is not configured");
  }
  return token;
}

function getYouVerifyBase() {
  const base = process.env.YOUVERIFY_BASE_URL || DEFAULT_BASE;
  return base.replace(/\/v2\/?$/, "");
}

// Response type for v2 API (NIN endpoint)
export type YouVerifyNinResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: {
    id: string;
    status: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    dateOfBirth?: string;
    mobile?: string;
    mobileIntFormat?: string;
    gender?: string;
    image?: string;
    vNIN?: string;
    idNumber?: string;
    type?: string;
    address?: {
      state?: string;
      lga?: string;
      town?: string;
      addressLine?: string;
    };
  };
};

type YouVerifyError = Error & { statusCode?: number };

function buildYouVerifyError(
  message: string,
  statusCode?: number,
): YouVerifyError {
  const error = new Error(message) as YouVerifyError;
  error.statusCode = statusCode;
  return error;
}

async function safeJson(
  response: Response,
): Promise<Record<string, unknown> | null> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function verifyNinWithYouVerify(nin: string) {
  const token = getYouVerifyToken();
  const baseUrl = getYouVerifyBase();

  logger.info("[YOUVERIFY] Calling API with NIN:", {
    nin: nin.substring(0, 3) + "********",
  });
  logger.info("[YOUVERIFY] Base URL:", { value: baseUrl });

  let lastError: unknown;

  // Retry up to 3 times for 502/503 errors (API instability)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      logger.info(`[YOUVERIFY] Attempt ${attempt}/3`);

      // Use the correct v2 endpoint for NIN verification
      const response = await fetch(`${baseUrl}/v2/api/identity/ng/nin`, {
        method: "POST",
        headers: {
          token: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: nin,
          isSubjectConsent: true,
        }),
      });

      logger.info(`[YOUVERIFY] Response status (attempt ${attempt}):`, {
        status: response.status,
      });

      // Handle insufficient funds (402)
      if (response.status === 402) {
        const data = await safeJson(response);
        logger.error(
          `[YOUVERIFY] Insufficient funds (attempt ${attempt}):`,
          data?.message,
        );
        throw buildYouVerifyError(
          String(data?.message || "YouVerify account has insufficient funds."),
          402,
        );
      }

      // Handle rate limiting (429)
      if (response.status === 429) {
        const data = await safeJson(response);
        logger.warn(`[YOUVERIFY] Rate limit hit (attempt ${attempt}):`, {
          message: data?.message,
        });
        throw buildYouVerifyError(
          String(
            data?.message ||
              "Too many requests. Please try again in 10 minutes.",
          ),
          429,
        );
      }

      // Handle forbidden / sandbox restrictions (403)
      if (response.status === 403) {
        const data = await safeJson(response);
        logger.warn(`[YOUVERIFY] Forbidden (attempt ${attempt}):`, {
          message: data?.message,
        });
        throw buildYouVerifyError(String(data?.message || "Forbidden"), 403);
      }

      // Retry on 502/503 errors (server errors)
      if (response.status === 502 || response.status === 503) {
        const text = await response.text();
        logger.warn(`[YOUVERIFY] Server error (attempt ${attempt}):`, {
          error: text,
        });
        lastError = buildYouVerifyError(
          `YouVerify API error (${response.status}): ${text}`,
          response.status,
        );

        if (attempt < 3) {
          const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s
          logger.info(`[YOUVERIFY] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      // Don't retry on other error codes (400, 401, 403, 404, etc.)
      if (!response.ok) {
        const data = await safeJson(response);
        logger.error("[YOUVERIFY] Error response:", { error: data });
        const errorMsg = String(
          data?.message || `API error (${response.status})`,
        );
        throw buildYouVerifyError(errorMsg, response.status);
      }

      const data = (await safeJson(response)) as YouVerifyNinResponse | null;
      if (!data) {
        throw buildYouVerifyError(
          "Invalid response from verification provider.",
        );
      }

      if (data.success === false || data.statusCode >= 400) {
        throw buildYouVerifyError(
          data.message || "Verification provider returned an error.",
        );
      }

      logger.info(`[YOUVERIFY] Success response received (attempt ${attempt})`);
      return data as YouVerifyNinResponse;
    } catch (error) {
      // Network errors or JSON parse errors
      if (
        error instanceof Error &&
        !error.message.includes("YouVerify API error")
      ) {
        logger.error(`[YOUVERIFY] Request failed (attempt ${attempt}):`, error);
        lastError = error;

        if (attempt < 3) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          logger.info(`[YOUVERIFY] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      } else {
        // API errors (non-502/503) - don't retry
        throw error;
      }
    }
  }

  logger.error("[YOUVERIFY] All retry attempts failed");
  throw lastError;
}
