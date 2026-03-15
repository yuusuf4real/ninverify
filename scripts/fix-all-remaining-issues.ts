#!/usr/bin/env tsx

/**
 * Fix All Remaining Issues
 * Comprehensive fix for all linting and validation issues
 */

import { readFileSync, writeFileSync } from "fs";

class ComprehensiveFixer {
  private log(message: string, type: "info" | "success" | "error" = "info") {
    const colors = {
      info: "\x1b[36m",
      success: "\x1b[32m",
      error: "\x1b[31m",
    };
    console.log(`${colors[type]}${message}\x1b[0m`);
  }

  private fixFile(
    filePath: string,
    fixes: Array<{ from: string; to: string }>,
  ) {
    try {
      let content = readFileSync(filePath, "utf8");
      let changed = false;

      for (const fix of fixes) {
        if (content.includes(fix.from)) {
          content = content.replace(
            new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
            fix.to,
          );
          changed = true;
        }
      }

      if (changed) {
        writeFileSync(filePath, content);
        this.log(`✅ Fixed ${filePath}`, "success");
      }
    } catch (error) {
      this.log(`❌ Error fixing ${filePath}: ${error}`, "error");
    }
  }

  async fixAllIssues() {
    this.log("🚀 FIXING ALL REMAINING ISSUES", "info");
    this.log("==============================", "info");

    // 1. Fix unused imports and variables
    this.log("\n🔧 Fixing unused imports and variables...", "info");

    // Fix admin dashboard metrics
    this.fixFile("app/api/admin/dashboard/metrics/route.ts", [
      {
        from: "export async function GET(request: Request) {",
        to: "export async function GET() {",
      },
    ]);

    // Fix support ticket management
    this.fixFile("components/organisms/support-ticket-management-client.tsx", [
      { from: 'import { useRouter } from "next/navigation";', to: "" },
      { from: 'import { formatDate } from "@/lib/format";', to: "" },
      {
        from: "const \\[sortBy, setSortBy\\] = useState",
        to: "const [sortBy] = useState",
      },
      {
        from: "const \\[sortOrder, setSortOrder\\] = useState",
        to: "const [sortOrder] = useState",
      },
    ]);

    // Fix ticket conversation
    this.fixFile("components/organisms/ticket-conversation.tsx", [
      { from: "CardContent,", to: "" },
    ]);

    // Fix ticket creation wizard
    this.fixFile("components/organisms/ticket-creation-wizard.tsx", [
      { from: "SelectTrigger,", to: "" },
    ]);

    // Fix transaction management
    this.fixFile("components/organisms/transaction-management-client.tsx", [
      { from: 'import { useRouter } from "next/navigation";', to: "" },
    ]);

    // Fix user management
    this.fixFile("components/organisms/user-management-client.tsx", [
      { from: 'import { useRouter } from "next/navigation";', to: "" },
    ]);

    // Fix verification management
    this.fixFile("components/organisms/verification-management-client.tsx", [
      { from: 'import { useRouter } from "next/navigation";', to: "" },
    ]);

    // 2. Fix explicit any types
    this.log("\n🔧 Fixing explicit any types...", "info");

    // Fix db-health.ts
    this.fixFile("lib/db-health.ts", [
      { from: "} catch \\(error: any\\) {", to: "} catch (error: unknown) {" },
      { from: "error: any", to: "error: unknown" },
    ]);

    // Fix audit-logger.ts
    this.fixFile("lib/security/audit-logger.ts", [
      {
        from: "metadata\\?: Record<string, any>",
        to: "metadata?: Record<string, unknown>",
      },
      {
        from: "context\\?: Record<string, any>",
        to: "context?: Record<string, unknown>",
      },
      {
        from: "additionalData\\?: Record<string, any>",
        to: "additionalData?: Record<string, unknown>",
      },
      { from: "data\\?: any", to: "data?: unknown" },
      { from: "error: any", to: "error: unknown" },
    ]);

    // Fix auth-security.ts
    this.fixFile("lib/security/auth-security.ts", [
      { from: "error: any", to: "error: unknown" },
    ]);

    // Fix encryption.ts
    this.fixFile("lib/security/encryption.ts", [
      { from: "} catch \\(error: any\\) {", to: "} catch (error: unknown) {" },
      { from: "error: any", to: "error: unknown" },
    ]);

    // Fix middleware.ts
    this.fixFile("lib/security/middleware.ts", [
      { from: "} catch \\(error: any\\) {", to: "} catch (error: unknown) {" },
      { from: "error: any", to: "error: unknown" },
    ]);

    // Fix secure-logger.ts
    this.fixFile("lib/security/secure-logger.ts", [
      {
        from: "context\\?: Record<string, any>",
        to: "context?: Record<string, unknown>",
      },
      { from: "data: any", to: "data: unknown" },
    ]);

    // 3. Clean up import statements
    this.log("\n🔧 Cleaning up import statements...", "info");

    const filesToCleanImports = [
      "components/organisms/support-ticket-management-client.tsx",
      "components/organisms/ticket-conversation.tsx",
      "components/organisms/ticket-creation-wizard.tsx",
      "components/organisms/transaction-management-client.tsx",
      "components/organisms/user-management-client.tsx",
      "components/organisms/verification-management-client.tsx",
    ];

    for (const file of filesToCleanImports) {
      try {
        let content = readFileSync(file, "utf8");

        // Remove empty import lines
        content = content.replace(/^import.*from.*;\n$/gm, (match) => {
          if (match.includes('""') || match.includes("''")) {
            return "";
          }
          return match;
        });

        // Clean up empty lines in imports
        content = content.replace(/,\s*\n\s*}/g, "\n}");
        content = content.replace(/{\s*,/g, "{");
        content = content.replace(/,\s*,/g, ",");

        writeFileSync(file, content);
        this.log(`✅ Cleaned imports in ${file}`, "success");
      } catch (error) {
        this.log(`❌ Error cleaning ${file}: ${error}`, "error");
      }
    }

    this.log("\n🎉 All fixes applied!", "success");
    this.log("Run linting again to verify fixes.", "info");
  }
}

// Run fixes
const fixer = new ComprehensiveFixer();
fixer.fixAllIssues().catch((error) => {
  console.error(`💥 Fix process failed: ${error.message}`);
  process.exit(1);
});
