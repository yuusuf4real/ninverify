import { nanoid } from "nanoid";
import { db } from "@/db/client";
import { otpSessions } from "@/db/new-schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface OTPProvider {
  sendOTP(phoneNumber: string, code: string): Promise<boolean>;
}

// Termii SMS Provider (Nigerian)
class TermiiProvider implements OTPProvider {
  private apiKey: string;
  private senderId: string;

  constructor() {
    this.apiKey = process.env.TERMII_API_KEY || "";
    this.senderId = process.env.TERMII_SENDER_ID || "VerifyNIN";
  }

  async sendOTP(phoneNumber: string, code: string): Promise<boolean> {
    try {
      const response = await fetch("https://api.ng.termii.com/api/sms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: phoneNumber,
          from: this.senderId,
          sms: `Your VerifyNIN verification code is: ${code}. Valid for 10 minutes. Do not share this code.`,
          type: "plain",
          api_key: this.apiKey,
          channel: "generic",
        }),
      });

      const result = await response.json();
      return response.ok && result.message_id;
    } catch (error) {
      console.error("Termii SMS error:", error);
      return false;
    }
  }
}

// Twilio Provider (Backup)
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
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`,
          },
          body: new URLSearchParams({
            From: this.fromNumber,
            To: phoneNumber,
            Body: `Your VerifyNIN verification code is: ${code}. Valid for 10 minutes. Do not share this code.`,
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Twilio SMS error:", error);
      return false;
    }
  }
}

export class OTPService {
  private provider: OTPProvider;
  private static OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes
  private static MAX_ATTEMPTS = 3;

  constructor() {
    // Use Termii for Nigerian numbers, Twilio as backup
    this.provider = process.env.OTP_PROVIDER === "twilio" 
      ? new TwilioProvider() 
      : new TermiiProvider();
  }

  /**
   * Generate and send OTP to phone number
   */
  async sendOTP(
    phoneNumber: string,
    ipAddress?: string,
    userAgent?: string
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
          gt(otpSessions.createdAt, new Date(Date.now() - 60000)) // 1 minute
        ),
      });

      if (recentOTP) {
        return { 
          success: false, 
          error: "Please wait 1 minute before requesting another OTP" 
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

      // Send OTP via provider
      const sent = await this.provider.sendOTP(normalizedPhone, otpCode);

      if (!sent) {
        // Mark as failed
        await db
          .update(otpSessions)
          .set({ status: "failed" })
          .where(eq(otpSessions.id, sessionId));

        return { success: false, error: "Failed to send OTP. Please try again." };
      }

      return { success: true, sessionId };
    } catch (error) {
      console.error("OTP send error:", error);
      return { success: false, error: "Internal server error" };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(
    sessionId: string,
    otpCode: string
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
            status: session.attempts + 1 >= session.maxAttempts ? "failed" : "pending"
          })
          .where(eq(otpSessions.id, sessionId));

        const remainingAttempts = session.maxAttempts - (session.attempts + 1);
        return { 
          success: false, 
          error: remainingAttempts > 0 
            ? `Invalid OTP. ${remainingAttempts} attempts remaining.`
            : "Too many failed attempts. Please request a new OTP."
        };
      }

      // Mark as verified
      await db
        .update(otpSessions)
        .set({ 
          status: "verified",
          verifiedAt: new Date()
        })
        .where(eq(otpSessions.id, sessionId));

      return { success: true, phoneNumber: session.phoneNumber };
    } catch (error) {
      console.error("OTP verify error:", error);
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
  async resendOTP(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const session = await db.query.otpSessions.findFirst({
        where: eq(otpSessions.id, sessionId),
      });

      if (!session) {
        return { success: false, error: "Session not found" };
      }

      // Check if too recent
      const timeSinceCreated = Date.now() - session.createdAt.getTime();
      if (timeSinceCreated < 60000) { // 1 minute
        return { 
          success: false, 
          error: "Please wait before requesting another OTP" 
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

      // Send new OTP
      const sent = await this.provider.sendOTP(session.phoneNumber, otpCode);

      if (!sent) {
        return { success: false, error: "Failed to send OTP" };
      }

      return { success: true };
    } catch (error) {
      console.error("OTP resend error:", error);
      return { success: false, error: "Internal server error" };
    }
  }
}