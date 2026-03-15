#!/usr/bin/env tsx

/**
 * Comprehensive Code Validation Script
 * Runs all quality checks and provides detailed feedback
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import chalk from "chalk";

interface ValidationResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

class CodeValidator {
  private results: ValidationResult[] = [];
  private startTime = Date.now();

  private log(
    message: string,
    type: "info" | "success" | "error" | "warning" = "info",
  ) {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
    };
    console.log(colors[type](message));
  }

  private async runCommand(
    command: string,
    description: string,
  ): Promise<ValidationResult> {
    this.log(`\n🔍 ${description}...`, "info");

    try {
      const output = execSync(command, {
        encoding: "utf8",
        stdio: "pipe",
        timeout: 300000, // 5 minutes timeout
      });

      this.log(`✅ ${description} - PASSED`, "success");
      return { name: description, passed: true, details: output };
    } catch (error: any) {
      this.log(`❌ ${description} - FAILED`, "error");
      return {
        name: description,
        passed: false,
        error: error.message,
        details: error.stdout || error.stderr,
      };
    }
  }

  private async validateFileExists(
    filePath: string,
    description: string,
  ): Promise<ValidationResult> {
    this.log(`\n📁 Checking ${description}...`, "info");

    if (existsSync(filePath)) {
      this.log(`✅ ${description} - EXISTS`, "success");
      return { name: description, passed: true };
    } else {
      this.log(`❌ ${description} - MISSING`, "error");
      return {
        name: description,
        passed: false,
        error: `File not found: ${filePath}`,
      };
    }
  }

  private async checkCodeQuality(): Promise<void> {
    this.log("\n🎯 PHASE 1: CODE QUALITY VALIDATION", "info");
    this.log("=====================================", "info");

    // 1. Check essential files
    this.results.push(
      await this.validateFileExists("package.json", "Package.json"),
    );
    this.results.push(
      await this.validateFileExists("tsconfig.json", "TypeScript config"),
    );
    this.results.push(
      await this.validateFileExists(".eslintrc.json", "ESLint config"),
    );
    this.results.push(
      await this.validateFileExists(
        ".eslintrc.security.json",
        "Security ESLint config",
      ),
    );

    // 2. Code formatting
    this.results.push(
      await this.runCommand(
        "npm run format:check",
        "Code formatting validation",
      ),
    );

    // 3. TypeScript compilation
    this.results.push(
      await this.runCommand("npm run type-check", "TypeScript compilation"),
    );

    // 4. ESLint validation (strict)
    this.results.push(
      await this.runCommand(
        "npm run lint -- --max-warnings 0",
        "ESLint validation (0 warnings allowed)",
      ),
    );

    // 5. Security linting (strict)
    this.results.push(
      await this.runCommand(
        "npm run lint:security -- --max-warnings 0",
        "Security linting (0 warnings allowed)",
      ),
    );
  }

  private async checkTests(): Promise<void> {
    this.log("\n🧪 PHASE 2: TEST VALIDATION", "info");
    this.log("============================", "info");

    // 1. Unit tests
    this.results.push(
      await this.runCommand(
        "npm test -- --passWithNoTests --coverage",
        "Unit tests with coverage",
      ),
    );

    // 2. Security tests
    this.results.push(
      await this.runCommand("npm run test:security", "Security tests"),
    );

    // 3. Integration tests (if available)
    try {
      execSync("npm run test:integration --dry-run", { stdio: "pipe" });
      this.results.push(
        await this.runCommand("npm run test:integration", "Integration tests"),
      );
    } catch {
      this.log("ℹ️  Integration tests not configured - skipping", "warning");
    }
  }

  private async checkBuild(): Promise<void> {
    this.log("\n🏗️ PHASE 3: BUILD VALIDATION", "info");
    this.log("=============================", "info");

    // 1. Production build
    this.results.push(
      await this.runCommand("npm run build", "Production build"),
    );

    // 2. Build size analysis
    this.results.push(
      await this.runCommand(
        'du -sh .next 2>/dev/null || echo "Build size check completed"',
        "Build size analysis",
      ),
    );
  }

  private async checkSecurity(): Promise<void> {
    this.log("\n🔒 PHASE 4: SECURITY VALIDATION", "info");
    this.log("===============================", "info");

    // 1. Dependency audit
    this.results.push(
      await this.runCommand(
        "npm audit --audit-level=high",
        "Dependency security audit",
      ),
    );

    // 2. License compliance
    this.results.push(
      await this.runCommand(
        'npx license-checker --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;0BSD;Unlicense;WTFPL;CC0-1.0;CC-BY-3.0;CC-BY-4.0" --excludePrivatePackages',
        "License compliance check",
      ),
    );

    // 3. Check for secrets
    try {
      const secretCheck = execSync(
        'grep -r "password.*=" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.yml" --exclude="*.yaml" || true',
        { encoding: "utf8" },
      );

      if (secretCheck.trim()) {
        this.results.push({
          name: "Secret detection",
          passed: false,
          error: "Potential secrets found",
          details: secretCheck,
        });
        this.log("❌ Secret detection - FAILED", "error");
      } else {
        this.results.push({ name: "Secret detection", passed: true });
        this.log("✅ Secret detection - PASSED", "success");
      }
    } catch (error: any) {
      this.results.push({
        name: "Secret detection",
        passed: false,
        error: error.message,
      });
    }
  }

  private async checkCodeStandards(): Promise<void> {
    this.log("\n📋 PHASE 5: CODE STANDARDS", "info");
    this.log("==========================", "info");

    // 1. Check for console.log in production code
    try {
      const consoleLogs = execSync(
        'grep -r "console\\." app/api lib --include="*.ts" --include="*.tsx" --exclude-dir=tests || true',
        { encoding: "utf8" },
      );

      if (consoleLogs.trim()) {
        this.results.push({
          name: "Console logs check",
          passed: false,
          error: "Console logs found in production code",
          details: consoleLogs,
        });
        this.log("❌ Console logs check - FAILED", "error");
      } else {
        this.results.push({ name: "Console logs check", passed: true });
        this.log("✅ Console logs check - PASSED", "success");
      }
    } catch (error: any) {
      this.results.push({
        name: "Console logs check",
        passed: false,
        error: error.message,
      });
    }

    // 2. Check for critical TODOs
    try {
      const criticalTodos = execSync(
        'grep -r "TODO\\|FIXME" app/api lib/security --include="*.ts" --include="*.tsx" || true',
        { encoding: "utf8" },
      );

      if (criticalTodos.trim()) {
        this.results.push({
          name: "Critical TODOs check",
          passed: false,
          error: "Critical TODOs found",
          details: criticalTodos,
        });
        this.log("❌ Critical TODOs check - FAILED", "error");
      } else {
        this.results.push({ name: "Critical TODOs check", passed: true });
        this.log("✅ Critical TODOs check - PASSED", "success");
      }
    } catch (error: any) {
      this.results.push({
        name: "Critical TODOs check",
        passed: false,
        error: error.message,
      });
    }
  }

  private generateReport(): void {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;

    this.log("\n📊 VALIDATION REPORT", "info");
    this.log("===================", "info");
    this.log(`⏱️  Duration: ${duration}s`, "info");
    this.log(`📈 Total checks: ${total}`, "info");
    this.log(`✅ Passed: ${passed}`, passed === total ? "success" : "info");
    this.log(`❌ Failed: ${failed}`, failed === 0 ? "info" : "error");

    if (failed > 0) {
      this.log("\n❌ FAILED CHECKS:", "error");
      this.log("================", "error");

      this.results
        .filter((r) => !r.passed)
        .forEach((result, index) => {
          this.log(`\n${index + 1}. ${result.name}`, "error");
          if (result.error) {
            this.log(`   Error: ${result.error}`, "error");
          }
          if (result.details) {
            this.log(
              `   Details: ${result.details.substring(0, 200)}...`,
              "warning",
            );
          }
        });

      this.log("\n🔧 NEXT STEPS:", "warning");
      this.log("=============", "warning");
      this.log("1. Fix all failed checks listed above", "warning");
      this.log("2. Run this script again to verify fixes", "warning");
      this.log("3. Only commit when all checks pass", "warning");

      process.exit(1);
    } else {
      this.log("\n🎉 ALL VALIDATIONS PASSED!", "success");
      this.log("=========================", "success");
      this.log("✅ Code quality standards met", "success");
      this.log("✅ All tests passing", "success");
      this.log("✅ Build successful", "success");
      this.log("✅ Security requirements met", "success");
      this.log("✅ Code standards compliant", "success");
      this.log("\n🚀 CODE IS READY FOR COMMIT!", "success");

      process.exit(0);
    }
  }

  async validate(): Promise<void> {
    this.log("🚀 COMPREHENSIVE CODE VALIDATION", "info");
    this.log("================================", "info");
    this.log(
      "This will run all quality checks required for commit approval.\n",
      "info",
    );

    try {
      await this.checkCodeQuality();
      await this.checkTests();
      await this.checkBuild();
      await this.checkSecurity();
      await this.checkCodeStandards();
    } catch (error) {
      this.log(`\n💥 Validation process failed: ${error}`, "error");
      process.exit(1);
    }

    this.generateReport();
  }
}

// Run validation
const validator = new CodeValidator();
validator.validate().catch((error) => {
  console.error(chalk.red(`💥 Validation failed: ${error.message}`));
  process.exit(1);
});
