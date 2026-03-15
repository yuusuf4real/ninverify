#!/usr/bin/env tsx

/**
 * Script to fix explicit 'any' types with proper TypeScript types
 */

import { readFileSync, writeFileSync } from "fs";

interface TypeFix {
  file: string;
  pattern: RegExp;
  replacement: string;
  description: string;
}

const typeFixes: TypeFix[] = [
  // lib/db-health.ts
  {
    file: "lib/db-health.ts",
    pattern: /error: any/g,
    replacement: "error: unknown",
    description: "Replace any with unknown for error types",
  },

  // lib/security/audit-logger.ts
  {
    file: "lib/security/audit-logger.ts",
    pattern: /metadata\?: any/g,
    replacement: "metadata?: Record<string, unknown>",
    description: "Replace any with Record<string, unknown> for metadata",
  },
  {
    file: "lib/security/audit-logger.ts",
    pattern: /context\?: any/g,
    replacement: "context?: Record<string, unknown>",
    description: "Replace any with Record<string, unknown> for context",
  },
  {
    file: "lib/security/audit-logger.ts",
    pattern: /error\?: any/g,
    replacement: "error?: Error | unknown",
    description: "Replace any with Error | unknown for error types",
  },
  {
    file: "lib/security/audit-logger.ts",
    pattern: /data: any/g,
    replacement: "data: Record<string, unknown>",
    description: "Replace any with Record<string, unknown> for data",
  },
  {
    file: "lib/security/audit-logger.ts",
    pattern: /let query/g,
    replacement: "const query",
    description: "Change let to const for query variable",
  },

  // lib/security/auth-security.ts
  {
    file: "lib/security/auth-security.ts",
    pattern: /payload: any/g,
    replacement: "payload: Record<string, unknown>",
    description: "Replace any with Record<string, unknown> for payload",
  },

  // lib/security/encryption.ts
  {
    file: "lib/security/encryption.ts",
    pattern: /data: any/g,
    replacement: "data: Record<string, unknown>",
    description: "Replace any with Record<string, unknown> for data",
  },
  {
    file: "lib/security/encryption.ts",
    pattern: /obj: any/g,
    replacement: "obj: Record<string, unknown>",
    description: "Replace any with Record<string, unknown> for obj",
  },
  {
    file: "lib/security/encryption.ts",
    pattern: /error: any/g,
    replacement: "error: unknown",
    description: "Replace any with unknown for error types",
  },

  // lib/security/input-validation.ts
  {
    file: "lib/security/input-validation.ts",
    pattern: /req: any/g,
    replacement: "req: { headers: Record<string, string | undefined> }",
    description: "Replace any with proper request type",
  },

  // lib/security/middleware.ts
  {
    file: "lib/security/middleware.ts",
    pattern: /error: any/g,
    replacement: "error: unknown",
    description: "Replace any with unknown for error types",
  },
  {
    file: "lib/security/middleware.ts",
    pattern: /req: any/g,
    replacement: "req: Request",
    description: "Replace any with Request type",
  },

  // lib/security/secure-logger.ts
  {
    file: "lib/security/secure-logger.ts",
    pattern: /context\?: any/g,
    replacement: "context?: Record<string, unknown>",
    description: "Replace any with Record<string, unknown> for context",
  },
  {
    file: "lib/security/secure-logger.ts",
    pattern: /data: any/g,
    replacement: "data: unknown",
    description: "Replace any with unknown for data",
  },
  {
    file: "lib/security/secure-logger.ts",
    pattern: /error\?: Error \| any/g,
    replacement: "error?: Error | unknown",
    description: "Replace any with unknown in error union type",
  },
];

function applyTypeFixes(filePath: string, fixes: TypeFix[]): boolean {
  try {
    let content = readFileSync(filePath, "utf8");
    let hasChanges = false;

    for (const fix of fixes.filter((f) => f.file === filePath)) {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        hasChanges = true;
        console.log(`✅ ${fix.description} in: ${filePath}`);
      }
    }

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

async function main() {
  console.log("🔧 Fixing explicit any types...\n");

  const filesToFix = [
    "lib/db-health.ts",
    "lib/security/audit-logger.ts",
    "lib/security/auth-security.ts",
    "lib/security/encryption.ts",
    "lib/security/input-validation.ts",
    "lib/security/middleware.ts",
    "lib/security/secure-logger.ts",
  ];

  let totalFixed = 0;

  for (const file of filesToFix) {
    const wasFixed = applyTypeFixes(file, typeFixes);
    if (wasFixed) {
      totalFixed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${filesToFix.length}`);
  console.log(`   Files with fixes: ${totalFixed}`);

  if (totalFixed > 0) {
    console.log("\n✅ Type fixes completed!");
  } else {
    console.log("\n✅ No type fixes needed.");
  }
}

main().catch(console.error);
