import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, "base64").subarray(0, 32)
  : Buffer.from(
      "default-key-32-chars-long-for-aes".padEnd(32, "0").slice(0, 32),
      "utf8",
    );

export function encrypt(text: string): string {
  try {
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Combine iv, authTag, and encrypted data
    return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
  } catch (error) {
    throw new Error("Encryption failed");
  }
}

export function decrypt(encryptedData: string): string {
  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    const decipher = createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error("Decryption failed");
  }
}

// Placeholder for PIIProtection - add if needed by secure-logger
export class PIIProtection {
  static sanitize(data: unknown): unknown {
    // Basic PII sanitization
    if (typeof data === "string") {
      // Mask potential NINs, phone numbers, etc.
      return data.replace(/\d{11}/g, "***MASKED***");
    }
    return data;
  }

  /**
   * Check if data contains PII
   */
  static containsPII(data: Record<string, unknown>): boolean {
    const piiFields = [
      "nin",
      "nins",
      "nationalId",
      "ssn",
      "phone",
      "phoneNumber",
      "mobile",
      "email",
      "emailAddress",
      "password",
      "secret",
      "token",
      "key",
      "card",
      "cardNumber",
      "cvv",
      "pin",
      "address",
      "fullAddress",
      "homeAddress",
    ];

    const piiPatterns = [
      /\b\d{11}\b/, // NIN pattern
      /\+?[\d\s-()]{10,}/, // Phone pattern
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email pattern
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Card pattern
    ];

    // Check field names
    for (const key of Object.keys(data)) {
      if (
        piiFields.some((field) =>
          key.toLowerCase().includes(field.toLowerCase()),
        )
      ) {
        return true;
      }
    }

    // Check values for PII patterns
    for (const value of Object.values(data)) {
      if (typeof value === "string") {
        if (piiPatterns.some((pattern) => pattern.test(value))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Sanitize data for logging
   */
  static sanitizeForLogging(
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (this.isSensitiveField(key)) {
        sanitized[key] = "***REDACTED***";
      } else if (typeof value === "string") {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeForLogging(
          value as Record<string, unknown>,
        );
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Check if field name indicates sensitive data
   */
  private static isSensitiveField(fieldName: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /key/i,
      /auth/i,
      /credential/i,
      /nin/i,
      /ssn/i,
      /card/i,
      /cvv/i,
      /pin/i,
    ];

    return sensitivePatterns.some((pattern) => pattern.test(fieldName));
  }

  /**
   * Sanitize string values
   */
  private static sanitizeString(str: string): string {
    return str
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "***CARD***")
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "***EMAIL***")
      .replace(/\+?[\d\s-()]{10,}/g, "***PHONE***")
      .replace(/\b\d{11}\b/g, "***NIN***")
      .replace(/Bearer\s+[A-Za-z0-9-._~+/]+=*/g, "Bearer ***TOKEN***")
      .replace(/sk_[a-zA-Z0-9_]+/g, "***SECRET_KEY***")
      .replace(/pk_[a-zA-Z0-9_]+/g, "***PUBLIC_KEY***");
  }
}
