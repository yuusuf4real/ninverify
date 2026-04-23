import { nanoid } from "nanoid";
import { db } from "@/db/client";
import { otpSessions } from "@/db/new-schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/security/secure-logger";

export interface OTPProvider {
  sendOTP(phoneNumber: string, code: string): Promise<boolean>;
}

// TextBelt Provider (Completely Free - 1 SMS per day per IP)
class TextBeltProvider implements OTPProvider {
  private apiKey: string;

  constructor() {
    // Use "textbelt" for free tier (1 SMS/day) or your paid key
    this.apiKey = process.env.TEXTBELT_API_KEY || "textbelt";
  }

  async sendOTP(phoneNumber: string, code: string): Promise<boolean> {
    try {
      logger.info("Sending OTP via TextBelt", {
        to: phoneNumber.substring(0, 8) + "***",
        apiKey: this.apiKey === "textbelt" ? "free-tier" : "paid-key",
      });

      const response = await fetch("https://textbelt.com/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phoneNumber,
          message: `Your VerifyNIN verification code is: ${code}. Valid for 10 minutes. Do not share this code.`,
          key: this.apiKey,
        }),
      });

      const result = await response.json();

      logger.info("TextBelt API response", {
        success: result.success,
        quotaRemaining: result.quotaRemaining,
        textId: result.textId,
        error: result.error,
      });

      if (!response.ok || !result.success) {
        logger.error("TextBelt API error", {
          status: response.status,
          error: result.error,
          quotaRemaining: result.quotaRemaining,
        });

        // Handle specific TextBelt errors
        if (result.error?.includes("Out of quota")) {
          logger.error("TextBelt quota exceeded", {
            suggestion: "Upgrade to paid plan or wait for quota reset",
          });
        }

        return false;
      }

      return true;
    } catch (error) {
      logger.error("TextBelt SMS network error", {
        error: error instanceof Error ? error.message : String(error),
        phoneNumber: phoneNumber.substring(0, 8) + "***",
      });
      return false;
    }
  }
}

// BulkSMS Nigeria Provider (50 Free SMS + Affordable Paid)
class BulkSMSNigeriaProvider implements OTPProvider {
  private apiToken: string;
  private senderId: string;

  constructor() {
    this.apiToken = process.env.BULKSMS_NIGERIA_API_TOKEN || "";
    this.senderId = process.env.BULKSMS_NIGERIA_SENDER_ID || "VerifyNIN";
  }

  async sendOTP(phoneNumber: string, code: string): Promise<boolean> {
    try {
      if (!this.apiToken) {
        logger.error("BulkSMS Nigeria API token not configured");
        return false;
      }

      logger.info("Sending OTP via BulkSMS Nigeria", {
        to: phoneNumber.substring(0, 8) + "***",
        sender: this.senderId,
      });

      const response = await fetch(
        "https://www.bulksmsnigeria.com/api/v2/sms",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            sender: this.senderId,
            message: `Your VerifyNIN verification code is: ${code}. Valid for 10 minutes. Do not share this code.`,
            recipients: phoneNumber,
          }),
        },
      );

      const result = await response.json();

      logger.info("BulkSMS Nigeria API response", {
        status: response.status,
        success: result.status === "success",
        messageId: result.data?.message_id,
        cost: result.data?.total_cost,
        balance: result.data?.balance_after,
      });

      if (!response.ok || result.status !== "success") {
        logger.error("BulkSMS Nigeria API error", {
          status: response.status,
          error: result.message,
          errorCode: result.error_code,
        });

        // Handle specific BulkSMS errors
        if (result.error_code === "INSUFFICIENT_CREDITS") {
          logger.error("BulkSMS Nigeria insufficient credits", {
            required: result.data?.required,
            available: result.data?.available,
            suggestion: "Top up your account balance",
          });
        }

        return false;
      }

      return true;
    } catch (error) {
      logger.error("BulkSMS Nigeria network error", {
        error: error instanceof Error ? error.message : String(error),
        phoneNumber: phoneNumber.substring(0, 8) + "***",
      });
      return false;
    }
  }
}

// Termii SMS Provider (Nigerian) - Enhanced for Production OTP
class TermiiProvider implements OTPProvider {
  private apiKey: string;
  private senderId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.TERMII_API_KEY || "";
    // Use "N-Alert" as default - it's pre-approved for DND route
    // Custom sender IDs like "VerifyNIN" need to be registered and whitelisted for DND
    this.senderId = process.env.TERMII_SENDER_ID || "N-Alert";
    this.baseUrl = process.env.TERMII_BASE_URL || "https://api.ng.termii.com";
  }

  async sendOTP(phoneNumber: string, code: string): Promise<boolean> {
    try {
      // Validate API key
      if (!this.apiKey) {
        logger.error("Termii API key not configured");
        return false;
      }

      const payload = {
        to: phoneNumber,
        from: this.senderId,
        sms: `Your VerifyNIN verification code is: ${code}. Valid for 10 minutes. Do not share this code.`,
        type: "plain",
        api_key: this.apiKey,
        channel: "dnd", // ✅ CRITICAL: Use DND route for OTP (bypasses DND restrictions)
      };

      logger.info("Sending OTP via Termii DND route", {
        to: phoneNumber.substring(0, 8) + "***", // Masked phone number
        from: this.senderId,
        channel: "dnd", // Confirm DND route usage
        baseUrl: this.baseUrl,
      });

      const response = await fetch(`${this.baseUrl}/api/sms/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      logger.info("Termii DND API response", {
        status: response.status,
        success: response.ok,
        messageId: result.message_id,
        code: result.code,
        message: result.message,
        balance: result.balance,
      });

      if (!response.ok) {
        logger.error("Termii DND API error", {
          status: response.status,
          statusText: response.statusText,
          body: result,
          payload: { ...payload, api_key: "[REDACTED]" },
        });

        // Enhanced error handling for DND route issues
        if (
          result.message?.includes("DND route not activated") ||
          result.message?.includes("dnd route") ||
          result.message?.includes("transactional route")
        ) {
          logger.error("❌ DND route not activated on Termii account", {
            senderId: this.senderId,
            solution: "Contact Termii support to activate DND route",
            supportEmail: "support@termii.com",
            supportPhone: "+234 803 644 2972",
            urgentAction:
              "Email support@termii.com with DND activation request",
          });
        }

        if (
          result.message?.includes("Sender ID") ||
          result.message?.includes("sender not whitelisted")
        ) {
          logger.error("❌ Sender ID not whitelisted for DND route", {
            senderId: this.senderId,
            suggestion:
              "Use 'N-Alert' (pre-approved) or request sender ID whitelisting",
            supportEmail: "support@termii.com",
            preApprovedSender: "N-Alert",
          });
        }

        if (
          result.message?.includes("insufficient") ||
          result.message?.includes("balance")
        ) {
          logger.error("❌ Insufficient Termii account balance", {
            currentBalance: result.balance,
            suggestion: "Top up your Termii account balance",
            dashboardUrl: "https://accounts.termii.com",
          });
        }

        if (
          result.message?.includes("invalid number") ||
          result.message?.includes("phone number")
        ) {
          logger.error("❌ Invalid phone number format", {
            phoneNumber: phoneNumber.substring(0, 8) + "***",
            expectedFormat: "+234XXXXXXXXXX",
            suggestion: "Ensure phone number is in international format",
          });
        }

        return false;
      }

      // Check if message was successfully queued
      const success = result.code === "ok" && result.message_id;

      if (!success) {
        logger.error("Termii DND message not queued", {
          result,
          expected: "code='ok' and message_id present",
          troubleshooting:
            "Check DND route activation and sender ID whitelisting",
        });
      } else {
        logger.info("✅ Termii DND OTP sent successfully", {
          messageId: result.message_id,
          balance: result.balance,
          phoneNumber: phoneNumber.substring(0, 8) + "***",
          route: "DND (transactional)",
        });
      }

      return success;
    } catch (error) {
      logger.error("Termii DND SMS network error", {
        error: error instanceof Error ? error.message : String(error),
        phoneNumber: phoneNumber.substring(0, 8) + "***",
        baseUrl: this.baseUrl,
        suggestion: "Check network connectivity and API endpoint",
      });
      return false;
    }
  }
}

// Twilio Provider (Backup/Alternative)
class TwilioProvider implements OTPProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    this.authToken = process.env.TWILIO_AUTH_TOKEN || "";
    this.fromNumber = process.env.TWILIO_FROM_NUMBER || "";
  }

  async sendOTP(phoneNumber: string, code: string): Promise<boolean> {
    try {
      // Validate configuration
      if (!this.accountSid || !this.authToken || !this.fromNumber) {
        logger.error("Twilio configuration incomplete", {
          hasAccountSid: !!this.accountSid,
          hasAuthToken: !!this.authToken,
          hasFromNumber: !!this.fromNumber,
        });
        return false;
      }

      const payload = {
        From: this.fromNumber,
        To: phoneNumber,
        Body: `Your VerifyNIN verification code is: ${code}. Valid for 10 minutes. Do not share this code.`,
      };

      logger.info("Sending OTP via Twilio", {
        to: phoneNumber.substring(0, 8) + "***", // Masked phone number
        from: this.fromNumber,
        accountSid: this.accountSid.substring(0, 8) + "***",
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`,
          },
          body: new URLSearchParams(payload),
        },
      );

      const result = await response.json();

      logger.info("Twilio API response", {
        status: response.status,
        success: response.ok,
        sid: result.sid,
        status_twilio: result.status,
        errorCode: result.error_code,
        errorMessage: result.error_message,
      });

      if (!response.ok) {
        logger.error("Twilio API error", {
          status: response.status,
          statusText: response.statusText,
          errorCode: result.error_code,
          errorMessage: result.error_message,
          moreInfo: result.more_info,
        });

        // Handle specific Twilio error cases
        if (result.error_code === 21211) {
          logger.error("Invalid Twilio phone number", {
            fromNumber: this.fromNumber,
            suggestion:
              "Verify your Twilio phone number is correct and verified",
          });
        }

        if (result.error_code === 21608) {
          logger.error("Unverified phone number", {
            toNumber: phoneNumber.substring(0, 8) + "***",
            suggestion: "Phone number may not be verified for trial account",
          });
        }

        if (result.error_code === 20003) {
          logger.error("Twilio authentication failed", {
            suggestion: "Check your Account SID and Auth Token",
          });
        }

        return false;
      }

      // Check if message was successfully queued/sent
      const success =
        result.sid && (result.status === "queued" || result.status === "sent");

      if (!success) {
        logger.error("Twilio message not queued", {
          result,
          expected: "sid present and status='queued' or 'sent'",
        });
      }

      return success;
    } catch (error) {
      logger.error("Twilio SMS network error", {
        error: error instanceof Error ? error.message : String(error),
        phoneNumber: phoneNumber.substring(0, 8) + "***",
      });
      return false;
    }
  }
}

export class OTPService {
  private providers: OTPProvider[] = [];
  private static OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes
  private static MAX_ATTEMPTS = 3;
  private isDevelopment = process.env.NODE_ENV === "development";

  constructor() {
    // Initialize all available providers based on configuration
    this.initializeProviders();

    logger.info("OTP Service initialized", {
      totalProviders: this.providers.length,
      isDevelopment: this.isDevelopment,
      availableProviders: this.getAvailableProviderNames(),
    });
  }

  private initializeProviders() {
    const providerPriority =
      process.env.OTP_PROVIDER_PRIORITY || "textbelt,bulksms,twilio,termii";
    const priorities = providerPriority.split(",").map((p) => p.trim());

    // Initialize providers in priority order
    for (const providerName of priorities) {
      try {
        switch (providerName.toLowerCase()) {
          case "textbelt":
            // TextBelt: Free tier (1 SMS/day) - highest priority for cost
            this.providers.push(new TextBeltProvider());
            break;

          case "bulksms":
          case "bulksms-nigeria":
            // BulkSMS Nigeria: 50 free SMS + affordable paid
            if (process.env.BULKSMS_NIGERIA_API_TOKEN) {
              this.providers.push(new BulkSMSNigeriaProvider());
            }
            break;

          case "twilio":
            // Twilio: $15 free credit + reliable paid
            if (
              process.env.TWILIO_ACCOUNT_SID &&
              process.env.TWILIO_AUTH_TOKEN
            ) {
              this.providers.push(new TwilioProvider());
            }
            break;

          case "termii":
            // Termii: Nigerian provider (requires DND route activation)
            if (process.env.TERMII_API_KEY) {
              this.providers.push(new TermiiProvider());
            }
            break;
        }
      } catch (error) {
        logger.warn(`Failed to initialize ${providerName} provider`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Fallback: If no providers configured, add TextBelt (always available)
    if (this.providers.length === 0) {
      logger.warn("No SMS providers configured, using TextBelt free tier");
      this.providers.push(new TextBeltProvider());
    }
  }

  private getAvailableProviderNames(): string[] {
    const names: string[] = [];

    // Check which providers are available
    if (this.providers.some((p) => p instanceof TextBeltProvider))
      names.push("TextBelt");
    if (this.providers.some((p) => p instanceof BulkSMSNigeriaProvider))
      names.push("BulkSMS-Nigeria");
    if (this.providers.some((p) => p instanceof TwilioProvider))
      names.push("Twilio");
    if (this.providers.some((p) => p instanceof TermiiProvider))
      names.push("Termii");

    return names;
  }

  /**
   * Generate and send OTP to phone number
   */
  async sendOTP(
    phoneNumber: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      // Normalize phone number (ensure it starts with +234)
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      if (!normalizedPhone) {
        return { success: false, error: "Invalid phone number format" };
      }

      // Check for recent OTP requests (rate limiting)
      const recentOTP = await db.query.otpSessions.findFirst({
        where: and(
          eq(otpSessions.phoneNumber, normalizedPhone),
          gt(otpSessions.createdAt, new Date(Date.now() - 60000)), // 1 minute
        ),
      });

      if (recentOTP) {
        return {
          success: false,
          error: "Please wait 1 minute before requesting another OTP",
        };
      }

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOTP = await bcrypt.hash(otpCode, 10);

      // Create OTP session
      const sessionId = nanoid();
      const expiresAt = new Date(Date.now() + OTPService.OTP_EXPIRY);

      await db.insert(otpSessions).values({
        id: sessionId,
        phoneNumber: normalizedPhone,
        otpCode: hashedOTP,
        status: "pending",
        expiresAt,
        ipAddress,
        userAgent,
      });

      // In development mode, display OTP in terminal for testing
      if (this.isDevelopment) {
        // eslint-disable-next-line no-console
        process.stdout.write(
          `\n${"=".repeat(60)}\n` +
            `🔐 DEVELOPMENT MODE - OTP CODE\n` +
            `${"=".repeat(60)}\n` +
            `Phone: ${normalizedPhone}\n` +
            `OTP Code: ${otpCode}\n` +
            `Session ID: ${sessionId}\n` +
            `Expires: ${expiresAt.toISOString()}\n` +
            `${"=".repeat(60)}\n\n`,
        );

        return { success: true, sessionId };
      }

      // Send OTP via providers in production (try all providers until success)
      let sent = false;
      let lastError = "";

      for (let i = 0; i < this.providers.length && !sent; i++) {
        const provider = this.providers[i];
        const providerName = provider.constructor.name;

        try {
          logger.info(`Attempting OTP via ${providerName}`, {
            phoneNumber: normalizedPhone.substring(0, 8) + "***",
            attempt: i + 1,
            totalProviders: this.providers.length,
          });

          sent = await provider.sendOTP(normalizedPhone, otpCode);

          if (sent) {
            logger.info(`OTP sent successfully via ${providerName}`, {
              phoneNumber: normalizedPhone.substring(0, 8) + "***",
              providerUsed: providerName,
              attemptNumber: i + 1,
            });
            break;
          } else {
            logger.warn(`${providerName} failed, trying next provider`, {
              phoneNumber: normalizedPhone.substring(0, 8) + "***",
              remainingProviders: this.providers.length - i - 1,
            });
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error);
          logger.error(`${providerName} threw error`, {
            error: lastError,
            phoneNumber: normalizedPhone.substring(0, 8) + "***",
          });
        }
      }

      if (!sent) {
        // Mark as failed
        await db
          .update(otpSessions)
          .set({ status: "failed" })
          .where(eq(otpSessions.id, sessionId));

        const errorMessage =
          this.providers.length > 1
            ? `Failed to send OTP via all ${this.providers.length} providers. Please try again.`
            : "Failed to send OTP. Please try again.";

        logger.error("All OTP providers failed", {
          phoneNumber: normalizedPhone.substring(0, 8) + "***",
          totalProviders: this.providers.length,
          lastError,
        });

        return {
          success: false,
          error: errorMessage,
        };
      }

      return { success: true, sessionId };
    } catch (error) {
      logger.error("OTP send error:", error);
      return { success: false, error: "Internal server error" };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(
    sessionId: string,
    otpCode: string,
  ): Promise<{ success: boolean; phoneNumber?: string; error?: string }> {
    try {
      // Get OTP session
      const session = await db.query.otpSessions.findFirst({
        where: eq(otpSessions.id, sessionId),
      });

      if (!session) {
        return { success: false, error: "Invalid or expired OTP session" };
      }

      // Check if expired
      if (new Date() > session.expiresAt) {
        await db
          .update(otpSessions)
          .set({ status: "expired" })
          .where(eq(otpSessions.id, sessionId));
        return { success: false, error: "OTP has expired" };
      }

      // Check if already failed too many times
      if (session.attempts >= session.maxAttempts) {
        return { success: false, error: "Too many failed attempts" };
      }

      // Verify OTP code
      const isValid = await bcrypt.compare(otpCode, session.otpCode);

      if (!isValid) {
        // Increment attempts
        await db
          .update(otpSessions)
          .set({
            attempts: session.attempts + 1,
            status:
              session.attempts + 1 >= session.maxAttempts
                ? "failed"
                : "pending",
          })
          .where(eq(otpSessions.id, sessionId));

        const remainingAttempts = session.maxAttempts - (session.attempts + 1);
        return {
          success: false,
          error:
            remainingAttempts > 0
              ? `Invalid OTP. ${remainingAttempts} attempts remaining.`
              : "Too many failed attempts. Please request a new OTP.",
        };
      }

      // Mark as verified
      await db
        .update(otpSessions)
        .set({
          status: "verified",
          verifiedAt: new Date(),
        })
        .where(eq(otpSessions.id, sessionId));

      return { success: true, phoneNumber: session.phoneNumber };
    } catch (error) {
      logger.error("OTP verify error:", error);
      return { success: false, error: "Internal server error" };
    }
  }

  /**
   * Normalize Nigerian phone number
   */
  private normalizePhoneNumber(phone: string): string | null {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, "");

    // Handle different formats
    if (digits.startsWith("234") && digits.length === 13) {
      return `+${digits}`;
    } else if (digits.startsWith("0") && digits.length === 11) {
      return `+234${digits.substring(1)}`;
    } else if (digits.length === 10) {
      return `+234${digits}`;
    }

    return null; // Invalid format
  }

  /**
   * Resend OTP (with rate limiting)
   */
  async resendOTP(
    sessionId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const session = await db.query.otpSessions.findFirst({
        where: eq(otpSessions.id, sessionId),
      });

      if (!session) {
        return { success: false, error: "Session not found" };
      }

      // Check if too recent
      const timeSinceCreated = Date.now() - session.createdAt.getTime();
      if (timeSinceCreated < 60000) {
        // 1 minute
        return {
          success: false,
          error: "Please wait before requesting another OTP",
        };
      }

      // Generate new OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOTP = await bcrypt.hash(otpCode, 10);
      const expiresAt = new Date(Date.now() + OTPService.OTP_EXPIRY);

      // Update session
      await db
        .update(otpSessions)
        .set({
          otpCode: hashedOTP,
          status: "pending",
          attempts: 0,
          expiresAt,
        })
        .where(eq(otpSessions.id, sessionId));

      // Send new OTP using multi-provider system
      let sent = false;

      for (let i = 0; i < this.providers.length && !sent; i++) {
        const provider = this.providers[i];
        const providerName = provider.constructor.name;

        try {
          logger.info(`Resending OTP via ${providerName}`, {
            phoneNumber: session.phoneNumber.substring(0, 8) + "***",
            attempt: i + 1,
          });

          sent = await provider.sendOTP(session.phoneNumber, otpCode);

          if (sent) {
            logger.info(`OTP resent successfully via ${providerName}`, {
              phoneNumber: session.phoneNumber.substring(0, 8) + "***",
            });
            break;
          }
        } catch (error) {
          logger.error(`${providerName} failed during resend`, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (!sent) {
        return {
          success: false,
          error: "Failed to resend OTP via all providers",
        };
      }

      return { success: true };
    } catch (error) {
      logger.error("OTP resend error:", error);
      return { success: false, error: "Internal server error" };
    }
  }
}
