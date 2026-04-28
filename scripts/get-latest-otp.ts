#!/usr/bin/env tsx
/**
 * Get Latest OTP Code from Database
 *
 * This script retrieves the latest OTP session for a phone number.
 * Note: The OTP code itself is hashed and cannot be retrieved.
 * This is for debugging purposes only.
 */

import { config } from "dotenv";
import { db } from "../db/client";
import { otpSessions } from "../db/new-schema";
import { eq, desc } from "drizzle-orm";

config();

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getLatestOTP() {
  const phoneNumber = process.argv[2];

  if (!phoneNumber) {
    log("\n❌ Please provide a phone number", "red");
    log("\nUsage:", "cyan");
    log("  npm run get-otp +2349015730035", "cyan");
    log("  npm run get-otp 09015730035", "cyan");
    process.exit(1);
  }

  // Normalize phone number
  let normalizedPhone = phoneNumber.replace(/\D/g, "");
  if (normalizedPhone.startsWith("0") && normalizedPhone.length === 11) {
    normalizedPhone = `+234${normalizedPhone.substring(1)}`;
  } else if (
    normalizedPhone.startsWith("234") &&
    normalizedPhone.length === 13
  ) {
    normalizedPhone = `+${normalizedPhone}`;
  } else if (normalizedPhone.length === 10) {
    normalizedPhone = `+234${normalizedPhone}`;
  } else if (!normalizedPhone.startsWith("+")) {
    normalizedPhone = `+${normalizedPhone}`;
  }

  log("\n" + "=".repeat(60), "cyan");
  log("Latest OTP Session Information", "bright");
  log("=".repeat(60), "cyan");

  try {
    const session = await db.query.otpSessions.findFirst({
      where: eq(otpSessions.phoneNumber, normalizedPhone),
      orderBy: [desc(otpSessions.createdAt)],
    });

    if (!session) {
      log(`\n❌ No OTP session found for ${normalizedPhone}`, "red");
      log("\nPossible reasons:", "yellow");
      log("  - Phone number format is different in database", "yellow");
      log("  - No OTP has been sent to this number yet", "yellow");
      log("  - Session has been deleted", "yellow");
      process.exit(1);
    }

    log(`\nPhone Number: ${session.phoneNumber}`, "cyan");
    log(`Session ID: ${session.id}`, "cyan");
    log(
      `Status: ${session.status}`,
      session.status === "verified" ? "green" : "yellow",
    );
    log(`Created: ${session.createdAt.toISOString()}`, "cyan");
    log(`Expires: ${session.expiresAt.toISOString()}`, "cyan");
    log(`Attempts: ${session.attempts}/${session.maxAttempts}`, "cyan");

    const now = new Date();
    const timeLeft = session.expiresAt.getTime() - now.getTime();
    const minutesLeft = Math.floor(timeLeft / 60000);
    const secondsLeft = Math.floor((timeLeft % 60000) / 1000);

    if (timeLeft > 0) {
      log(
        `Time Remaining: ${minutesLeft}:${secondsLeft.toString().padStart(2, "0")}`,
        "green",
      );
    } else {
      log(`Time Remaining: EXPIRED`, "red");
    }

    log("\n" + "=".repeat(60), "cyan");
    log("⚠️  IMPORTANT NOTES", "yellow");
    log("=".repeat(60), "cyan");

    log("\n1. OTP Code is HASHED in database (cannot be retrieved)", "yellow");
    log("2. In DEVELOPMENT mode, OTP is shown in terminal output", "yellow");
    log('3. Look for "DEVELOPMENT MODE - OTP CODE" in your terminal', "yellow");
    log("4. If you missed it, request a new OTP (wait 1 minute)", "yellow");

    if (session.status === "verified") {
      log("\n✅ This OTP has already been verified!", "green");
      log("   You can proceed to the next step.", "green");
    } else if (session.status === "expired") {
      log("\n❌ This OTP has expired!", "red");
      log("   Request a new OTP to continue.", "red");
    } else if (session.status === "failed") {
      log("\n❌ This OTP session has failed!", "red");
      log("   Too many incorrect attempts. Request a new OTP.", "red");
    } else if (session.attempts >= session.maxAttempts) {
      log("\n❌ Maximum attempts reached!", "red");
      log("   Request a new OTP to continue.", "red");
    } else if (timeLeft <= 0) {
      log("\n❌ OTP has expired!", "red");
      log("   Request a new OTP to continue.", "red");
    } else {
      log("\n✅ OTP is still valid!", "green");
      log(
        `   You have ${session.maxAttempts - session.attempts} attempts remaining.`,
        "green",
      );
      log(`   Check your terminal for the OTP code.`, "green");
    }

    log("\n" + "=".repeat(60) + "\n", "cyan");
  } catch (error) {
    log("\n❌ Database error:", "red");
    console.error(error);
    process.exit(1);
  }
}

getLatestOTP().catch((error) => {
  log("\n❌ Script failed:", "red");
  console.error(error);
  process.exit(1);
});
