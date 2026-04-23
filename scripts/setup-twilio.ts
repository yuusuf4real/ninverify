#!/usr/bin/env tsx

/**
 * Twilio Setup Helper Script
 * 
 * This script helps you configure Twilio OTP service by validating
 * your credentials and testing the connection.
 */

import { config } from "dotenv";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Load environment variables
config();

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

async function validateTwilioCredentials(config: TwilioConfig): Promise<boolean> {
  try {
    console.log("🔍 Validating Twilio credentials...");
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}.json`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Credentials valid!");
      console.log(`   Account: ${data.friendly_name}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Type: ${data.type}`);
      return true;
    } else {
      const error = await response.json();
      console.log("❌ Invalid credentials:");
      console.log(`   Error: ${error.message}`);
      return false;
    }
  } catch (error) {
    console.log("❌ Network error validating credentials:");
    console.error(error);
    return false;
  }
}

async function validatePhoneNumber(config: TwilioConfig): Promise<boolean> {
  try {
    console.log("📱 Validating phone number...");
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/IncomingPhoneNumbers.json`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const phoneNumber = data.incoming_phone_numbers.find(
        (num: any) => num.phone_number === config.fromNumber
      );

      if (phoneNumber) {
        console.log("✅ Phone number is valid and owned by your account!");
        console.log(`   Number: ${phoneNumber.phone_number}`);
        console.log(`   Friendly Name: ${phoneNumber.friendly_name}`);
        return true;
      } else {
        console.log("❌ Phone number not found in your account");
        console.log("   Available numbers:");
        data.incoming_phone_numbers.forEach((num: any) => {
          console.log(`   - ${num.phone_number} (${num.friendly_name})`);
        });
        return false;
      }
    } else {
      console.log("❌ Error validating phone number");
      return false;
    }
  } catch (error) {
    console.log("❌ Network error validating phone number:");
    console.error(error);
    return false;
  }
}

function updateEnvFile(updates: Record<string, string>) {
  try {
    const envPath = join(process.cwd(), ".env");
    let envContent = "";
    
    try {
      envContent = readFileSync(envPath, "utf8");
    } catch {
      console.log("📝 Creating new .env file...");
    }

    // Update or add each variable
    Object.entries(updates).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, "m");
      const line = `${key}="${value}"`;
      
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, line);
      } else {
        envContent += `\n${line}`;
      }
    });

    writeFileSync(envPath, envContent);
    console.log("✅ Environment file updated!");
  } catch (error) {
    console.log("❌ Error updating .env file:");
    console.error(error);
  }
}

async function setupTwilio() {
  console.log("🚀 Twilio OTP Setup Helper");
  console.log("=" .repeat(50));

  // Check if Twilio is already configured
  const existingConfig = {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    fromNumber: process.env.TWILIO_FROM_NUMBER || "",
  };

  const hasExistingConfig = existingConfig.accountSid && existingConfig.authToken;

  if (hasExistingConfig) {
    console.log("📋 Found existing Twilio configuration:");
    console.log(`   Account SID: ${existingConfig.accountSid.substring(0, 8)}***`);
    console.log(`   Auth Token: ${existingConfig.authToken.substring(0, 8)}***`);
    console.log(`   From Number: ${existingConfig.fromNumber}`);
    console.log();

    // Validate existing configuration
    const isValid = await validateTwilioCredentials(existingConfig);
    
    if (isValid && existingConfig.fromNumber) {
      await validatePhoneNumber(existingConfig);
    }

    // Switch to Twilio
    console.log("\n🔄 Switching OTP provider to Twilio...");
    updateEnvFile({ OTP_PROVIDER: "twilio" });

    console.log("\n✅ Setup complete! You can now test with:");
    console.log("   npm run test:twilio-otp");
    
  } else {
    console.log("❌ Twilio not configured. Please add these to your .env file:");
    console.log();
    console.log("# Get these from https://console.twilio.com");
    console.log("TWILIO_ACCOUNT_SID=\"your_account_sid_here\"");
    console.log("TWILIO_AUTH_TOKEN=\"your_auth_token_here\"");
    console.log("TWILIO_FROM_NUMBER=\"+1234567890\"");
    console.log("OTP_PROVIDER=\"twilio\"");
    console.log();
    console.log("📖 See docs/TWILIO-OTP-SETUP.md for detailed setup instructions");
  }

  console.log("\n" + "=".repeat(50));
  console.log("🏁 Setup completed");
}

// Run the setup
if (require.main === module) {
  setupTwilio().catch(console.error);
}

export { setupTwilio };