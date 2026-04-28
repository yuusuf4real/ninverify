/**
 * YouVerify Staging Configuration Test
 *
 * This script tests the YouVerify staging/sandbox configuration
 * to ensure the API token and base URL are correctly set up.
 *
 * Run: npx tsx scripts/test-youverify-staging.ts
 */

import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

interface YouVerifyConfig {
  environment: string;
  token: string;
  baseUrl: string;
}

interface TestResult {
  test: string;
  status: "PASS" | "FAIL" | "WARNING";
  message: string;
}

function getYouVerifyConfig(): YouVerifyConfig {
  return {
    environment: process.env.YOUVERIFY_ENVIRONMENT || "",
    token: process.env.YOUVERIFY_TOKEN || "",
    baseUrl: process.env.YOUVERIFY_BASE_URL || "",
  };
}

function validateConfiguration(config: YouVerifyConfig): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: Environment variable is set
  if (!config.environment) {
    results.push({
      test: "Environment Variable",
      status: "FAIL",
      message: "YOUVERIFY_ENVIRONMENT is not set",
    });
  } else {
    results.push({
      test: "Environment Variable",
      status: "PASS",
      message: `Environment: ${config.environment}`,
    });
  }

  // Test 2: Token is set
  if (!config.token) {
    results.push({
      test: "API Token",
      status: "FAIL",
      message: "YOUVERIFY_TOKEN is not set",
    });
  } else {
    const tokenPreview = `${config.token.substring(0, 10)}...${config.token.substring(config.token.length - 4)}`;
    results.push({
      test: "API Token",
      status: "PASS",
      message: `Token: ${tokenPreview} (${config.token.length} chars)`,
    });
  }

  // Test 3: Base URL is set
  if (!config.baseUrl) {
    results.push({
      test: "Base URL",
      status: "FAIL",
      message: "YOUVERIFY_BASE_URL is not set",
    });
  } else {
    results.push({
      test: "Base URL",
      status: "PASS",
      message: `URL: ${config.baseUrl}`,
    });
  }

  // Test 4: Environment and URL match
  if (config.environment && config.baseUrl) {
    const isStaging =
      config.environment === "staging" || config.environment === "sandbox";
    const isStagingUrl = config.baseUrl.includes("sandbox");
    const isProduction = config.environment === "production";
    const isProductionUrl = !config.baseUrl.includes("sandbox");

    if ((isStaging && !isStagingUrl) || (isProduction && !isProductionUrl)) {
      results.push({
        test: "Environment/URL Match",
        status: "FAIL",
        message: `Mismatch: ${config.environment} environment with ${config.baseUrl}`,
      });
    } else {
      results.push({
        test: "Environment/URL Match",
        status: "PASS",
        message: "Environment and URL are correctly matched",
      });
    }
  }

  // Test 5: Token format validation
  if (config.token) {
    // YouVerify tokens typically have format: XXXXXXXX.YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
    const hasCorrectFormat = /^[A-Za-z0-9]{8}\.[A-Za-z0-9]{40,}$/.test(
      config.token,
    );

    if (!hasCorrectFormat) {
      results.push({
        test: "Token Format",
        status: "WARNING",
        message: "Token format may be incorrect (expected: 8chars.40+chars)",
      });
    } else {
      results.push({
        test: "Token Format",
        status: "PASS",
        message: "Token format looks correct",
      });
    }
  }

  return results;
}

async function testApiConnection(config: YouVerifyConfig): Promise<TestResult> {
  if (!config.token || !config.baseUrl) {
    return {
      test: "API Connection",
      status: "FAIL",
      message: "Cannot test - missing token or base URL",
    };
  }

  try {
    // Test with a simple endpoint (this will fail with 404 but confirms auth works)
    const response = await fetch(`${config.baseUrl}/v2/identities/test`, {
      method: "GET",
      headers: {
        Token: config.token,
        "Content-Type": "application/json",
      },
    });

    // We expect 404 for test endpoint, but 401 means auth failed
    if (response.status === 401) {
      return {
        test: "API Connection",
        status: "FAIL",
        message:
          "Authentication failed - token may be invalid or for wrong environment",
      };
    } else if (response.status === 403) {
      return {
        test: "API Connection",
        status: "FAIL",
        message: "Forbidden - token may not have required permissions",
      };
    } else if (response.status === 404) {
      return {
        test: "API Connection",
        status: "PASS",
        message: "API connection successful (token is valid)",
      };
    } else {
      return {
        test: "API Connection",
        status: "WARNING",
        message: `Unexpected response: ${response.status} ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      test: "API Connection",
      status: "FAIL",
      message: `Connection error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

function printResults(results: TestResult[]) {
  console.log("\n" + "=".repeat(80));
  console.log("YouVerify Staging Configuration Test Results");
  console.log("=".repeat(80) + "\n");

  let passCount = 0;
  let failCount = 0;
  let warningCount = 0;

  results.forEach((result) => {
    const icon =
      result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "⚠️";
    console.log(`${icon} ${result.test}`);
    console.log(`   ${result.message}\n`);

    if (result.status === "PASS") passCount++;
    else if (result.status === "FAIL") failCount++;
    else warningCount++;
  });

  console.log("=".repeat(80));
  console.log(
    `Summary: ${passCount} passed, ${failCount} failed, ${warningCount} warnings`,
  );
  console.log("=".repeat(80) + "\n");

  if (failCount > 0) {
    console.log("❌ Configuration has errors. Please fix the issues above.\n");
    console.log("Common fixes:");
    console.log(
      '1. For staging: YOUVERIFY_BASE_URL="https://api.sandbox.youverify.co"',
    );
    console.log(
      '2. For production: YOUVERIFY_BASE_URL="https://api.youverify.co"',
    );
    console.log(
      "3. Ensure token is from the correct environment (staging vs production)\n",
    );
  } else if (warningCount > 0) {
    console.log("⚠️  Configuration has warnings but should work.\n");
  } else {
    console.log("✅ Configuration looks good! Ready to use.\n");
  }
}

async function main() {
  console.log("Testing YouVerify Staging Configuration...\n");

  const config = getYouVerifyConfig();

  // Run validation tests
  const validationResults = validateConfiguration(config);

  // Run API connection test
  console.log("Testing API connection...");
  const connectionResult = await testApiConnection(config);

  // Print all results
  printResults([...validationResults, connectionResult]);

  // Exit with appropriate code
  const hasFailures = [...validationResults, connectionResult].some(
    (r) => r.status === "FAIL",
  );
  process.exit(hasFailures ? 1 : 0);
}

main().catch((error) => {
  console.error("Test script error:", error);
  process.exit(1);
});
