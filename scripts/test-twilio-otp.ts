#!/usr/bin/env tsx

/**
 * Twilio OTP Test Script
 * 
 * This script helps test Twilio OTP functionality without going through the full UI flow.
 * Run this to verify your Twilio configuration is working.
 */

import { config } from "dotenv";
import { OTPService } from "../lib/otp-service";

// Load environment variables
config();

async function testTwilioOTP() {
  console.log("🧪 Testing Twilio OTP Configuration");
  console.log("=" .repeat(50));

  // Check environment variables
  const requiredVars = {
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER,
    OTP_PROVIDER: process.env.OTP_PROVIDER,
  };

  console.log("📋 Environment Configuration:");
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (key === "TWILIO_AUTH_TOKEN") {
      console.log(`  ${key}: ${value ? value.substring(0, 8) + "***" : "❌ Not set"}`);
    } else {
      console.log(`  ${key}: ${value || "❌ Not set"}`);
    }
  });

  // Check if Twilio is configured
  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.log("\n❌ Missing required environment variables:");
    missingVars.forEach(varName => console.log(`  - ${varName}`));
    console.log("\n💡 Please set these in your .env file and try again.");
    return;
  }

  // Check if OTP_PROVIDER is set to twilio
  if (process.env.OTP_PROVIDER !== "twilio") {
    console.log(`\n⚠️  OTP_PROVIDER is set to "${process.env.OTP_PROVIDER}"`);
    console.log("   To test Twilio, set OTP_PROVIDER=twilio in your .env file");
    console.log("   Or temporarily override by running:");
    console.log("   OTP_PROVIDER=twilio npm run test:twilio-otp");
    return;
  }

  console.log("\n✅ All environment variables are configured");

  // Get test phone number
  const testPhone = process.env.TEST_PHONE_NUMBER || "+2348012345678";
  console.log(`\n📱 Test Phone Number: ${testPhone}`);
  console.log("   💡 For Twilio trial accounts, this number must be verified in your Twilio console");
  console.log("   💡 For production accounts, any valid phone number works");

  try {
    console.log("\n🚀 Sending test OTP...");
    
    const otpService = new OTPService();
    const result = await otpService.sendOTP(
      testPhone,
      "127.0.0.1", // Test IP
      "Test-Script/1.0" // Test User Agent
    );

    if (result.success) {
      console.log("✅ OTP sent successfully!");
      console.log(`   Session ID: ${result.sessionId}`);
      console.log("\n📱 Check your phone for the OTP message");
      console.log("   Message should be from your Twilio number");
      console.log("   Format: 'Your VerifyNIN verification code is: XXXXXX. Valid for 10 minutes. Do not share this code.'");
      
      if (result.sessionId) {
        console.log("\n🔍 To test OTP verification, you can use:");
        console.log(`   Session ID: ${result.sessionId}`);
        console.log("   Enter the 6-digit code you received via SMS");
      }
    } else {
      console.log("❌ Failed to send OTP");
      console.log(`   Error: ${result.error}`);
      console.log("\n🔍 Check the logs above for detailed error information");
      console.log("   Common issues:");
      console.log("   - Trial account: Phone number not verified in Twilio console");
      console.log("   - Invalid credentials: Check Account SID and Auth Token");
      console.log("   - Invalid from number: Check your Twilio phone number");
      console.log("   - Insufficient balance: Top up your Twilio account");
    }

  } catch (error) {
    console.log("💥 Unexpected error during OTP test:");
    console.error(error);
  }

  console.log("\n" + "=".repeat(50));
  console.log("🏁 Test completed");
}

// Run the test
if (require.main === module) {
  testTwilioOTP().catch(console.error);
}

export { testTwilioOTP };