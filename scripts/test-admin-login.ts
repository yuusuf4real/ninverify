#!/usr/bin/env tsx

/**
 * Test script to verify admin login page functionality
 * This script tests the admin login page styling and functionality
 */

import { execSync } from "child_process";
import chalk from "chalk";

interface TestResult {
  name: string;
  status: "pass" | "fail";
  message: string;
}

const tests: TestResult[] = [];

function addTest(name: string, status: "pass" | "fail", message: string) {
  tests.push({ name, status, message });
}

function runTest(
  name: string,
  testFn: () => boolean,
  successMsg: string,
  failMsg: string,
) {
  try {
    const result = testFn();
    addTest(name, result ? "pass" : "fail", result ? successMsg : failMsg);
  } catch (error) {
    addTest(name, "fail", `${failMsg}: ${error}`);
  }
}

async function testAdminLoginPage() {
  console.log(chalk.blue("🔍 Testing Admin Login Page Functionality\n"));

  // Test 1: Check if admin login page builds successfully
  runTest(
    "Build Test",
    () => {
      try {
        execSync("npm run build", { stdio: "pipe" });
        return true;
      } catch {
        return false;
      }
    },
    "Admin login page builds successfully",
    "Admin login page build failed",
  );

  // Test 2: Check if Tailwind classes are properly configured
  runTest(
    "Tailwind Configuration",
    () => {
      const tailwindConfig = require("../tailwind.config.ts").default;
      return tailwindConfig.content.some((path: string) =>
        path.includes("sys-4a7404d6f114b5b0"),
      );
    },
    "Tailwind configuration includes admin login path",
    "Tailwind configuration missing admin login path",
  );

  // Test 3: Check if required UI components exist
  runTest(
    "UI Components",
    () => {
      const fs = require("fs");
      const requiredComponents = [
        "components/ui/button.tsx",
        "components/ui/input.tsx",
        "components/ui/loading-spinner.tsx",
        "components/organisms/admin-login-form.tsx",
      ];
      return requiredComponents.every((component) => fs.existsSync(component));
    },
    "All required UI components exist",
    "Missing required UI components",
  );

  // Test 4: Check if admin login page file exists
  runTest(
    "Admin Login Page",
    () => {
      const fs = require("fs");
      return fs.existsSync("app/sys-4a7404d6f114b5b0/page.tsx");
    },
    "Admin login page file exists",
    "Admin login page file missing",
  );

  // Test 5: Check if middleware includes admin route protection
  runTest(
    "Middleware Configuration",
    () => {
      const fs = require("fs");
      const middlewareContent = fs.readFileSync("middleware.ts", "utf8");
      return middlewareContent.includes("sys-4a7404d6f114b5b0");
    },
    "Middleware includes admin route protection",
    "Middleware missing admin route protection",
  );

  // Print results
  console.log(chalk.blue("\n📊 Test Results:\n"));

  let passCount = 0;
  let failCount = 0;

  tests.forEach((test) => {
    const icon = test.status === "pass" ? "✅" : "❌";
    const color = test.status === "pass" ? chalk.green : chalk.red;

    console.log(`${icon} ${color(test.name)}: ${test.message}`);

    if (test.status === "pass") passCount++;
    else failCount++;
  });

  console.log(
    chalk.blue(`\n📈 Summary: ${passCount} passed, ${failCount} failed\n`),
  );

  if (failCount === 0) {
    console.log(chalk.green("🎉 All tests passed! Admin login page is ready."));
  } else {
    console.log(
      chalk.red("⚠️  Some tests failed. Please review the issues above."),
    );
  }

  return failCount === 0;
}

// Run tests
testAdminLoginPage().then((success) => {
  process.exit(success ? 0 : 1);
});
