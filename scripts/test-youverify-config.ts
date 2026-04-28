#!/usr/bin/env tsx
/**
 * YouVerify Configuration Test Script
 *
 * Tests the YouVerify API configuration to ensure it's set up correctly
 */

import { config } from "dotenv";
config();

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message: string) {
  console.log("\n" + "=".repeat(60));
  log(message, "bright");
  console.log("=".repeat(60) + "\n");
}

async function testYouVerifyConfig() {
  header("YouVerify Configuration Test");

  // Check environment variables
  log("1. Checking Environment Variables...", "cyan");

  const env = process.env.YOUVERIFY_ENVIRONMENT;
  const token = process.env.YOUVERIFY_TOKEN;
  const baseUrl = process.env.YOUVERIFY_BASE_URL;

  console.log(`   YOUVERIFY_ENVIRONMENT: ${env || "NOT SET"}`);
  console.log(
    `   YOUVERIFY_TOKEN: ${token ? token.substring(0, 10) + "..." : "NOT SET"}`,
  );
  console.log(`   YOUVERIFY_BASE_URL: ${baseUrl || "NOT SET"}`);

  if (!token) {
    log("\n❌ YOUVERIFY_TOKEN is not set!", "red");
    log("   Please set it in your .env file", "yellow");
    process.exit(1);
  }

  // Validate configuration consistency
  log("\n2. Validating Configuration Consistency...", "cyan");

  const expectedUrls = {
    production: "https://api.youverify.co",
    staging: "https://api.sandbox.youverify.co",
    development: "https://api.sandbox.youverify.co",
  };

  const expectedUrl = expectedUrls[env as keyof typeof expectedUrls];

  if (baseUrl && baseUrl !== expectedUrl) {
    log(`\n⚠️  WARNING: URL mismatch detected!`, "yellow");
    console.log(`   Environment: ${env}`);
    console.log(`   Expected URL: ${expectedUrl}`);
    console.log(`   Actual URL: ${baseUrl}`);
    log("\n   This may cause verification failures!", "yellow");
  } else {
    log("   ✅ Configuration is consistent", "green");
  }

  // Test API connectivity
  log("\n3. Testing API Connectivity...", "cyan");

  const testUrl = baseUrl || expectedUrl;

  try {
    log(`   Calling: ${testUrl}/v2/api/identity/ng/nin`, "blue");

    const response = await fetch(`${testUrl}/v2/api/identity/ng/nin`, {
      method: "POST",
      headers: {
        token: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: "11111111111", // Test NIN
        isSubjectConsent: true,
      }),
    });

    console.log(`   Response Status: ${response.status}`);

    if (response.status === 401) {
      log("\n❌ Authentication Failed (401)", "red");
      log("   Possible causes:", "yellow");
      log("   - Wrong API token", "yellow");
      log(
        "   - Token is for different environment (staging vs production)",
        "yellow",
      );
      log("   - Token expired or revoked", "yellow");
      log("\n   Solution:", "cyan");
      log("   1. Check your token in YouVerify dashboard", "cyan");
      log(
        "   2. Ensure token environment matches YOUVERIFY_ENVIRONMENT",
        "cyan",
      );
      log("   3. Generate new token if needed", "cyan");
    } else if (response.status === 402) {
      log("\n⚠️  Insufficient Funds (402)", "yellow");
      log("   Your YouVerify account has insufficient balance", "yellow");
      log("\n   Solution:", "cyan");
      log("   1. Top up your YouVerify wallet", "cyan");
      log("   2. Or switch to staging environment for free testing", "cyan");
    } else if (response.status === 403) {
      log("\n❌ Forbidden (403)", "red");
      log("   Possible causes:", "yellow");
      log("   - NIN permission not enabled on API key", "yellow");
      log("   - Sandbox restrictions", "yellow");
      log("\n   Solution:", "cyan");
      log("   1. Regenerate API key with NIN permission enabled", "cyan");
      log("   2. Check sandbox limitations", "cyan");
    } else if (response.status === 200 || response.status === 201) {
      const data = await response.json();
      log("\n✅ API Connection Successful!", "green");
      console.log(
        "   Response:",
        JSON.stringify(data, null, 2).substring(0, 200) + "...",
      );
    } else {
      log(`\n⚠️  Unexpected Response (${response.status})`, "yellow");
      const text = await response.text();
      console.log("   Response:", text.substring(0, 200));
    }
  } catch (error) {
    log("\n❌ Network Error", "red");
    console.log(
      "   Error:",
      error instanceof Error ? error.message : String(error),
    );
    log("\n   Possible causes:", "yellow");
    log("   - No internet connection", "yellow");
    log("   - Firewall blocking requests", "yellow");
    log("   - Invalid API URL", "yellow");
  }

  // Summary
  header("Configuration Summary");

  if (env === "production") {
    log("🔴 PRODUCTION MODE", "red");
    log("   - Uses real NIN data", "yellow");
    log("   - Costs money per verification", "yellow");
    log("   - Requires wallet balance", "yellow");
    log("   - Ensure NDPR compliance", "yellow");
  } else if (env === "staging" || env === "development") {
    log("🟢 STAGING/DEVELOPMENT MODE", "green");
    log("   - Uses test NIN data", "cyan");
    log("   - Free testing", "cyan");
    log("   - Test NIN: 11111111111", "cyan");
    log("   - Returns mock data", "cyan");
  } else {
    log("⚠️  UNKNOWN ENVIRONMENT", "yellow");
    log(`   Environment: ${env}`, "yellow");
  }

  log("\n✅ Configuration test complete!", "green");
  log("\nNext steps:", "cyan");
  log("1. Start your development server: npm run dev", "cyan");
  log("2. Test the verification flow", "cyan");
  log("3. Monitor logs for any errors", "cyan");
}

// Run the test
testYouVerifyConfig().catch((error) => {
  log("\n❌ Test failed with error:", "red");
  console.error(error);
  process.exit(1);
});
