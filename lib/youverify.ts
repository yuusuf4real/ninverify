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

function buildYouVerifyError(message: string, statusCode?: number): YouVerifyError {
  const error = new Error(message) as YouVerifyError;
  error.statusCode = statusCode;
  return error;
}

async function safeJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function verifyNinWithYouVerify(nin: string) {
  const token = getYouVerifyToken();
  const baseUrl = getYouVerifyBase();
  
  console.log("[YOUVERIFY] Calling API with NIN:", nin.substring(0, 3) + "********");
  console.log("[YOUVERIFY] Base URL:", baseUrl);
  
  let lastError: unknown;
  
  // Retry up to 3 times for 502/503 errors (API instability)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[YOUVERIFY] Attempt ${attempt}/3`);
      
      // Use the correct v2 endpoint for NIN verification
      const response = await fetch(`${baseUrl}/v2/api/identity/ng/nin`, {
        method: "POST",
        headers: {
          "token": token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: nin,
          isSubjectConsent: true
        })
      });

      console.log(`[YOUVERIFY] Response status (attempt ${attempt}):`, response.status);

      // Handle insufficient funds (402)
      if (response.status === 402) {
        const data = await safeJson(response);
        console.error(`[YOUVERIFY] Insufficient funds (attempt ${attempt}):`, data?.message);
        throw buildYouVerifyError(
          String(data?.message || "YouVerify account has insufficient funds."),
          402
        );
      }

      // Handle rate limiting (429)
      if (response.status === 429) {
        const data = await safeJson(response);
        console.warn(`[YOUVERIFY] Rate limit hit (attempt ${attempt}):`, data?.message);
        throw buildYouVerifyError(
          String(data?.message || "Too many requests. Please try again in 10 minutes."),
          429
        );
      }

      // Handle forbidden / sandbox restrictions (403)
      if (response.status === 403) {
        const data = await safeJson(response);
        console.warn(`[YOUVERIFY] Forbidden (attempt ${attempt}):`, data?.message);
        throw buildYouVerifyError(String(data?.message || "Forbidden"), 403);
      }

      // Retry on 502/503 errors (server errors)
      if (response.status === 502 || response.status === 503) {
        const text = await response.text();
        console.warn(`[YOUVERIFY] Server error (attempt ${attempt}):`, text);
        lastError = buildYouVerifyError(
          `YouVerify API error (${response.status}): ${text}`,
          response.status
        );
        
        if (attempt < 3) {
          const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s
          console.log(`[YOUVERIFY] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      // Don't retry on other error codes (400, 401, 403, 404, etc.)
      if (!response.ok) {
        const data = await safeJson(response);
        console.error("[YOUVERIFY] Error response:", data);
        const errorMsg = String(data?.message || `API error (${response.status})`);
        throw buildYouVerifyError(errorMsg, response.status);
      }

      const data = (await safeJson(response)) as YouVerifyNinResponse | null;
      if (!data) {
        throw buildYouVerifyError("Invalid response from verification provider.");
      }

      if (data.success === false || data.statusCode >= 400) {
        throw buildYouVerifyError(data.message || "Verification provider returned an error.");
      }

      console.log(`[YOUVERIFY] Success response received (attempt ${attempt})`);
      return data as YouVerifyNinResponse;
      
    } catch (error) {
      // Network errors or JSON parse errors
      if (error instanceof Error && !error.message.includes("YouVerify API error")) {
        console.error(`[YOUVERIFY] Request failed (attempt ${attempt}):`, error);
        lastError = error;
        
        if (attempt < 3) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`[YOUVERIFY] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } else {
        // API errors (non-502/503) - don't retry
        throw error;
      }
    }
  }
  
  console.error("[YOUVERIFY] All retry attempts failed");
  throw lastError;
}
