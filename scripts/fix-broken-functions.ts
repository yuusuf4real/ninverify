#!/usr/bin/env tsx

/**
 * Script to fix broken function structures in management client components
 */

import { readFileSync, writeFileSync } from "fs";

function fixSupportTicketManagementClient(): boolean {
  const filePath = "components/organisms/support-ticket-management-client.tsx";
  try {
    let content = readFileSync(filePath, "utf8");

    // Fix the broken handleSortChange function
    const brokenPattern =
      /const handleCategoryChange = \(value: string\) => \{[^}]+\};\s*\} else \{[^}]+\}[^}]+\};/s;

    if (brokenPattern.test(content)) {
      const fixedCode = `const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };`;

      content = content.replace(brokenPattern, fixedCode);
      writeFileSync(filePath, content, "utf8");
      console.log(`✅ Fixed function structure in: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error);
    return false;
  }
}

function fixTransactionManagementClient(): boolean {
  const filePath = "components/organisms/transaction-management-client.tsx";
  try {
    let content = readFileSync(filePath, "utf8");

    // Similar fix for transaction management
    const brokenPattern =
      /const handleStatusChange = \(value: string\) => \{[^}]+\};\s*\} else \{[^}]+\}[^}]+\};/s;

    if (brokenPattern.test(content)) {
      const fixedCode = `const handleStatusChange = (value: string) => {
    setStatus(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };`;

      content = content.replace(brokenPattern, fixedCode);
      writeFileSync(filePath, content, "utf8");
      console.log(`✅ Fixed function structure in: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error);
    return false;
  }
}

function fixUserManagementClient(): boolean {
  const filePath = "components/organisms/user-management-client.tsx";
  try {
    let content = readFileSync(filePath, "utf8");

    // Similar fix for user management
    const brokenPattern =
      /const handleStatusChange = \(value: string\) => \{[^}]+\};\s*\} else \{[^}]+\}[^}]+\};/s;

    if (brokenPattern.test(content)) {
      const fixedCode = `const handleStatusChange = (value: string) => {
    setStatus(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };`;

      content = content.replace(brokenPattern, fixedCode);
      writeFileSync(filePath, content, "utf8");
      console.log(`✅ Fixed function structure in: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error);
    return false;
  }
}

function fixVerificationManagementClient(): boolean {
  const filePath = "components/organisms/verification-management-client.tsx";
  try {
    let content = readFileSync(filePath, "utf8");

    // Similar fix for verification management
    const brokenPattern =
      /const handleStatusChange = \(value: string\) => \{[^}]+\};\s*\} else \{[^}]+\}[^}]+\};/s;

    if (brokenPattern.test(content)) {
      const fixedCode = `const handleStatusChange = (value: string) => {
    setStatus(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };`;

      content = content.replace(brokenPattern, fixedCode);
      writeFileSync(filePath, content, "utf8");
      console.log(`✅ Fixed function structure in: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error);
    return false;
  }
}

// Alternative approach: Remove the broken code blocks entirely
function removeBrokenCodeBlocks(filePath: string): boolean {
  try {
    let content = readFileSync(filePath, "utf8");
    let hasChanges = false;

    // Remove orphaned } else { blocks
    const orphanedElsePattern = /\s*\} else \{[^}]*\}[^}]*\};\s*/g;
    if (orphanedElsePattern.test(content)) {
      content = content.replace(orphanedElsePattern, "");
      hasChanges = true;
    }

    // Remove orphaned function-like blocks
    const orphanedBlockPattern = /\s*\};\s*const get\w+Icon[^}]*\};\s*/g;
    if (orphanedBlockPattern.test(content)) {
      content = content.replace(orphanedBlockPattern, "");
      hasChanges = true;
    }

    if (hasChanges) {
      writeFileSync(filePath, content, "utf8");
      console.log(`✅ Removed broken code blocks from: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error);
    return false;
  }
}

async function main() {
  console.log("🔧 Fixing broken function structures...\n");

  const files = [
    "components/organisms/support-ticket-management-client.tsx",
    "components/organisms/transaction-management-client.tsx",
    "components/organisms/user-management-client.tsx",
    "components/organisms/verification-management-client.tsx",
  ];

  let totalFixed = 0;

  // Try specific fixes first
  if (fixSupportTicketManagementClient()) totalFixed++;
  if (fixTransactionManagementClient()) totalFixed++;
  if (fixUserManagementClient()) totalFixed++;
  if (fixVerificationManagementClient()) totalFixed++;

  // If specific fixes didn't work, try removing broken blocks
  for (const file of files) {
    if (removeBrokenCodeBlocks(file)) {
      totalFixed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${files.length}`);
  console.log(`   Files with fixes: ${totalFixed}`);

  if (totalFixed > 0) {
    console.log("\n✅ Function structure fixes completed!");
  } else {
    console.log("\n✅ No function structure fixes needed.");
  }
}

main().catch(console.error);
