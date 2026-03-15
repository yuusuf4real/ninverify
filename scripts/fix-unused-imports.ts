#!/usr/bin/env tsx

/**
 * Script to remove unused imports from TypeScript files
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import path from "path";

interface UnusedImport {
  file: string;
  line: number;
  import: string;
}

const unusedImports: UnusedImport[] = [
  // From lint output
  {
    file: "app/api/admin/dashboard/metrics/route.ts",
    line: 3,
    import: "wallets",
  },
  { file: "app/api/admin/dashboard/metrics/route.ts", line: 5, import: "sql" },
  {
    file: "app/api/admin/dashboard/metrics/route.ts",
    line: 9,
    import: "request",
  },
  {
    file: "app/api/admin/transactions/reconcile/route.ts",
    line: 6,
    import: "and",
  },
  { file: "app/api/admin/transactions/route.ts", line: 4, import: "wallets" },
  { file: "app/api/admin/transactions/route.ts", line: 6, import: "ilike" },
  { file: "app/api/admin/transactions/route.ts", line: 6, import: "inArray" },
  { file: "app/api/admin/users/route.ts", line: 6, import: "ilike" },
  { file: "app/api/admin/verifications/route.ts", line: 6, import: "ilike" },
  {
    file: "app/api/support/tickets/[id]/messages/route.ts",
    line: 6,
    import: "desc",
  },
  { file: "app/api/support/tickets/[id]/route.ts", line: 5, import: "and" },
  { file: "app/api/support/tickets/route.ts", line: 15, import: "and" },
  {
    file: "components/organisms/reconciliation-modal.tsx",
    line: 18,
    import: "CardHeader",
  },
  {
    file: "components/organisms/reconciliation-modal.tsx",
    line: 18,
    import: "CardTitle",
  },
  {
    file: "components/organisms/support-ticket-management-client.tsx",
    line: 7,
    import: "Filter",
  },
  {
    file: "components/organisms/ticket-conversation.tsx",
    line: 19,
    import: "Card",
  },
  {
    file: "components/organisms/ticket-conversation.tsx",
    line: 19,
    import: "CardContent",
  },
  {
    file: "components/organisms/ticket-conversation.tsx",
    line: 19,
    import: "CardHeader",
  },
  {
    file: "components/organisms/ticket-conversation.tsx",
    line: 19,
    import: "CardTitle",
  },
  {
    file: "components/organisms/ticket-creation-wizard.tsx",
    line: 17,
    import: "CardHeader",
  },
  {
    file: "components/organisms/ticket-creation-wizard.tsx",
    line: 17,
    import: "CardTitle",
  },
  {
    file: "components/organisms/ticket-creation-wizard.tsx",
    line: 22,
    import: "Select",
  },
  {
    file: "components/organisms/ticket-creation-wizard.tsx",
    line: 22,
    import: "SelectContent",
  },
  {
    file: "components/organisms/ticket-creation-wizard.tsx",
    line: 22,
    import: "SelectItem",
  },
  {
    file: "components/organisms/ticket-creation-wizard.tsx",
    line: 22,
    import: "SelectTrigger",
  },
  {
    file: "components/organisms/ticket-creation-wizard.tsx",
    line: 22,
    import: "SelectValue",
  },
  {
    file: "components/organisms/transaction-management-client.tsx",
    line: 7,
    import: "Filter",
  },
  {
    file: "components/organisms/transaction-management-client.tsx",
    line: 15,
    import: "XCircle",
  },
  { file: "components/organisms/user-detail-modal.tsx", line: 5, import: "X" },
  {
    file: "components/organisms/user-management-client.tsx",
    line: 13,
    import: "Calendar",
  },
  {
    file: "components/organisms/user-management-client.tsx",
    line: 16,
    import: "AlertCircle",
  },
  {
    file: "components/organisms/user-ticket-dashboard.tsx",
    line: 19,
    import: "CardHeader",
  },
  {
    file: "components/organisms/user-ticket-dashboard.tsx",
    line: 19,
    import: "CardTitle",
  },
  {
    file: "components/organisms/verification-management-client.tsx",
    line: 7,
    import: "Filter",
  },
  {
    file: "components/organisms/verification-management-client.tsx",
    line: 15,
    import: "Clock",
  },
  { file: "lib/security/auth-security.ts", line: 11, import: "users" },
  { file: "lib/security/middleware.ts", line: 6, import: "logger" },
];

function removeUnusedImport(filePath: string, importName: string): boolean {
  try {
    let content = readFileSync(filePath, "utf8");
    let hasChanges = false;

    // Pattern to match import statements
    const importPatterns = [
      // Named import in destructured import
      new RegExp(`,\\s*${importName}\\s*,`, "g"),
      new RegExp(`{\\s*${importName}\\s*,`, "g"),
      new RegExp(`,\\s*${importName}\\s*}`, "g"),
      new RegExp(`{\\s*${importName}\\s*}`, "g"),
      // Single import
      new RegExp(`import\\s+${importName}\\s+from`, "g"),
      // Default import
      new RegExp(
        `import\\s+{\\s*${importName}\\s*}\\s+from[^;]+;?\\s*\\n?`,
        "g",
      ),
    ];

    for (const pattern of importPatterns) {
      if (pattern.test(content)) {
        if (pattern.source.includes("{") && pattern.source.includes("}")) {
          // Handle destructured imports
          content = content.replace(pattern, (match) => {
            if (match.includes(",")) {
              // Remove the import and comma
              return match.replace(new RegExp(`\\s*${importName}\\s*,?`), "");
            } else {
              // Single import in destructuring, remove entire import line
              return "";
            }
          });
        } else {
          content = content.replace(pattern, "");
        }
        hasChanges = true;
        break;
      }
    }

    // Clean up empty import lines
    content = content.replace(/import\s*{\s*}\s*from[^;]+;?\s*\n?/g, "");

    // Clean up multiple empty lines
    content = content.replace(/\n\s*\n\s*\n/g, "\n\n");

    if (hasChanges) {
      writeFileSync(filePath, content, "utf8");
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

function removeUnusedVariables(filePath: string): boolean {
  try {
    let content = readFileSync(filePath, "utf8");
    let hasChanges = false;

    // Remove unused variable assignments
    const unusedVarPatterns = [
      /const\s+thirtyDaysAgo\s*=\s*[^;]+;\s*\n?/g,
      /const\s+formatDate\s*=\s*[^;]+;\s*\n?/g,
      /const\s+router\s*=\s*useRouter\(\);\s*\n?/g,
      /const\s+handleSortChange\s*=\s*[^;]+;\s*\n?/g,
      /const\s+getSortIcon\s*=\s*[^;]+;\s*\n?/g,
      /const\s+recentVerifications\s*=\s*[^;]+;\s*\n?/g,
      /const\s+isAdmin\s*=\s*[^;]+;\s*\n?/g,
    ];

    for (const pattern of unusedVarPatterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, "");
        hasChanges = true;
      }
    }

    if (hasChanges) {
      writeFileSync(filePath, content, "utf8");
      return true;
    }

    return false;
  } catch (error) {
    console.error(
      `❌ Error removing unused variables from ${filePath}:`,
      error,
    );
    return false;
  }
}

async function main() {
  console.log("🔧 Removing unused imports and variables...\n");

  let totalFixed = 0;

  // Remove unused imports
  for (const { file, import: importName } of unusedImports) {
    const wasFixed = removeUnusedImport(file, importName);
    if (wasFixed) {
      console.log(`✅ Removed unused import '${importName}' from: ${file}`);
      totalFixed++;
    }
  }

  // Remove unused variables
  const filesToCheckForVars = [
    "app/api/admin/dashboard/metrics/route.ts",
    "components/organisms/support-ticket-management-client.tsx",
    "components/organisms/ticket-conversation.tsx",
    "components/organisms/ticket-creation-wizard.tsx",
    "components/organisms/transaction-management-client.tsx",
    "components/organisms/user-management-client.tsx",
    "components/organisms/verification-management-client.tsx",
  ];

  for (const file of filesToCheckForVars) {
    const wasFixed = removeUnusedVariables(file);
    if (wasFixed) {
      console.log(`✅ Removed unused variables from: ${file}`);
      totalFixed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total fixes applied: ${totalFixed}`);

  if (totalFixed > 0) {
    console.log("\n✅ Unused imports and variables cleanup completed!");
  } else {
    console.log("\n✅ No unused imports or variables found.");
  }
}

main().catch(console.error);
