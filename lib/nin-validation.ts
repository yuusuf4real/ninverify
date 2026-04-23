/**
 * NIN Pre-validation Service
 *
 * This service performs lightweight NIN validation to check if a NIN exists
 * in the NIMC database before requiring payment. This prevents users from
 * paying for invalid NINs.
 */

import { logger } from "./security/secure-logger";

interface NINValidationResponse {
  isValid: boolean;
  exists: boolean;
  error?: string;
  message?: string;
}

interface YouVerifyValidationResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: {
    status: "found" | "not_found";
    firstName?: string;
    lastName?: string;
    // We only need basic validation, not full data
  };
}

export class NINValidationService {
  private static readonly YOUVERIFY_BASE_URL =
    process.env.YOUVERIFY_BASE_URL || "https://api.youverify.co";
  private static readonly YOUVERIFY_TOKEN = process.env.YOUVERIFY_TOKEN;

  /**
   * Validate NIN format (basic client-side validation)
   */
  static validateNINFormat(nin: string): { isValid: boolean; error?: string } {
    // Remove any spaces or special characters
    const cleanNIN = nin.replace(/\s+/g, "");

    // Check if it's exactly 11 digits
    if (!/^\d{11}$/.test(cleanNIN)) {
      return {
        isValid: false,
        error: "NIN must be exactly 11 digits",
      };
    }

    // Basic checksum validation (if NIMC has a specific algorithm)
    // For now, we'll just check the format
    return { isValid: true };
  }

  /**
   * Pre-validate NIN existence using YouVerify API
   * This is a lightweight check to see if the NIN exists before payment
   */
  static async preValidateNIN(nin: string): Promise<NINValidationResponse> {
    try {
      // First, validate format
      const formatValidation = this.validateNINFormat(nin);
      if (!formatValidation.isValid) {
        return {
          isValid: false,
          exists: false,
          error: formatValidation.error,
        };
      }

      // Check if we have the required environment variables
      if (!this.YOUVERIFY_TOKEN) {
        logger.error("YouVerify token not configured for NIN validation");
        return {
          isValid: false,
          exists: false,
          error: "NIN validation service not configured",
        };
      }

      // Call YouVerify API for basic NIN existence check
      const response = await fetch(
        `${this.YOUVERIFY_BASE_URL}/v2/api/identity/ng/nin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token: this.YOUVERIFY_TOKEN,
          },
          body: JSON.stringify({
            id: nin.replace(/\s+/g, ""), // Clean NIN
            isSubjectConsent: true,
          }),
        },
      );

      const data: YouVerifyValidationResponse = await response.json();

      logger.info("NIN pre-validation response", {
        nin: nin.substring(0, 3) + "****" + nin.substring(7), // Masked for logging
        status: data.data?.status,
        success: data.success,
      });

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 402) {
          return {
            isValid: false,
            exists: false,
            error:
              "Insufficient funds for NIN validation. Please contact support.",
          };
        }

        if (response.status === 403) {
          return {
            isValid: false,
            exists: false,
            error: "NIN validation service temporarily unavailable",
          };
        }

        return {
          isValid: false,
          exists: false,
          error: "Unable to validate NIN at this time",
        };
      }

      // Check if NIN exists in NIMC database
      const ninExists = data.success && data.data?.status === "found";

      return {
        isValid: true,
        exists: ninExists,
        message: ninExists
          ? "NIN is valid and exists in NIMC database"
          : "NIN does not exist in NIMC database",
      };
    } catch (error) {
      logger.error("NIN pre-validation failed", {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        isValid: false,
        exists: false,
        error: "Network error during NIN validation. Please try again.",
      };
    }
  }

  /**
   * Validate NIN in development/staging environment
   * Uses test data to avoid API costs during development
   */
  static async preValidateNINDevelopment(
    nin: string,
  ): Promise<NINValidationResponse> {
    const formatValidation = this.validateNINFormat(nin);
    if (!formatValidation.isValid) {
      return {
        isValid: false,
        exists: false,
        error: formatValidation.error,
      };
    }

    // Test NINs that should pass validation
    const validTestNINs = [
      "11111111111", // YouVerify test NIN
      "22222222222", // Additional test NIN
      "12345678901", // Another test NIN
    ];

    const cleanNIN = nin.replace(/\s+/g, "");
    const exists = validTestNINs.includes(cleanNIN);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      isValid: true,
      exists,
      message: exists
        ? "NIN is valid (test environment)"
        : "NIN does not exist (test environment)",
    };
  }

  /**
   * Main validation method that chooses between production and development
   */
  static async validateNIN(nin: string): Promise<NINValidationResponse> {
    const environment = process.env.NODE_ENV || "development";
    const youverifyEnv = process.env.YOUVERIFY_ENVIRONMENT || "staging";

    // Use development validation in non-production environments
    if (environment === "development" || youverifyEnv === "staging") {
      return this.preValidateNINDevelopment(nin);
    }

    return this.preValidateNIN(nin);
  }
}
