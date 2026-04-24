/**
 * Basic NIN Format Validation Service
 * 
 * Simple client-side NIN format validation without pre-payment verification.
 * This maintains the original workflow where users can proceed to payment
 * with any properly formatted NIN.
 */

export class NINValidationService {
  /**
   * Validate NIN format (basic client-side validation only)
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

    return { isValid: true };
  }
}
