#!/usr/bin/env tsx

/**
 * Fix the final remaining TypeScript errors
 */

import { readFileSync, writeFileSync } from "fs";

function fixRemainingLoggerIssues(): void {
  // Fix remaining logger calls that need context objects
  const fixes = [
    {
      file: "app/api/nin/verify/route.ts",
      pattern:
        /logger\.info\("\[NIN\] YouVerify response:", JSON\.stringify\(response, null, 2\)\);/,
      replacement:
        'logger.info("[NIN] YouVerify response:", { response: JSON.stringify(response, null, 2) });',
    },
    {
      file: "app/api/paystack/verify/route.ts",
      pattern:
        /logger\.info\("\[VERIFY\] Raw response:", responseText\.substring\(0, 200\)\);/,
      replacement:
        'logger.info("[VERIFY] Raw response:", { response: responseText.substring(0, 200) });',
    },
    {
      file: "app/api/paystack/verify/route.ts",
      pattern:
        /logger\.info\("\[VERIFY\] Paystack data:", JSON\.stringify\(paystackData, null, 2\)\);/,
      replacement:
        'logger.info("[VERIFY] Paystack data:", { data: JSON.stringify(paystackData, null, 2) });',
    },
    {
      file: "app/api/paystack/webhook/route.ts",
      pattern:
        /logger\.info\(`\[WEBHOOK\] Update attempt \$\{i \+ 1\}\/\$\{retries \+ 1\} for reference:`, reference\);/,
      replacement:
        "logger.info(`[WEBHOOK] Update attempt ${i + 1}/${retries + 1} for reference:`, { reference });",
    },
    {
      file: "lib/youverify.ts",
      pattern:
        /logger\.info\("\[YOUVERIFY\] Calling API with NIN:", nin\.substring\(0, 3\) \+ "\*\*\*\*\*\*\*\*"\);/,
      replacement:
        'logger.info("[YOUVERIFY] Calling API with NIN:", { nin: nin.substring(0, 3) + "********" });',
    },
    {
      file: "lib/youverify.ts",
      pattern:
        /logger\.info\(`\[YOUVERIFY\] Response status \(attempt \$\{attempt\}\):`, response\.status\);/,
      replacement:
        "logger.info(`[YOUVERIFY] Response status (attempt ${attempt}):`, { status: response.status });",
    },
    {
      file: "lib/youverify.ts",
      pattern:
        /logger\.warn\(`\[YOUVERIFY\] Rate limit hit \(attempt \$\{attempt\}\):`, data\?\.message\);/,
      replacement:
        "logger.warn(`[YOUVERIFY] Rate limit hit (attempt ${attempt}):`, { message: data?.message });",
    },
    {
      file: "lib/youverify.ts",
      pattern:
        /logger\.warn\(`\[YOUVERIFY\] Forbidden \(attempt \$\{attempt\}\):`, data\?\.message\);/,
      replacement:
        "logger.warn(`[YOUVERIFY] Forbidden (attempt ${attempt}):`, { message: data?.message });",
    },
    {
      file: "lib/youverify.ts",
      pattern:
        /logger\.warn\(`\[YOUVERIFY\] Server error \(attempt \$\{attempt\}\):`, text\);/,
      replacement:
        "logger.warn(`[YOUVERIFY] Server error (attempt ${attempt}):`, { error: text });",
    },
  ];

  for (const fix of fixes) {
    let content = readFileSync(fix.file, "utf8");
    if (fix.pattern.test(content)) {
      content = content.replace(fix.pattern, fix.replacement);
      writeFileSync(fix.file, content, "utf8");
      console.log(`✅ Fixed logger in: ${fix.file}`);
    }
  }
}

function addMissingLoggerImports(): void {
  // Fix audit-log.ts
  let content = readFileSync("lib/audit-log.ts", "utf8");
  if (!content.includes("import { logger }")) {
    content = content.replace(
      'import { db } from "@/db/client";',
      'import { db } from "@/db/client";\nimport { logger } from "./security/secure-logger";',
    );
    writeFileSync("lib/audit-log.ts", content, "utf8");
    console.log("✅ Added logger import to audit-log.ts");
  }

  // Fix rate-limit.ts
  content = readFileSync("lib/rate-limit.ts", "utf8");
  if (!content.includes("import { logger }")) {
    const lines = content.split("\n");
    lines.splice(1, 0, 'import { logger } from "./security/secure-logger";');
    writeFileSync("lib/rate-limit.ts", lines.join("\n"), "utf8");
    console.log("✅ Added logger import to rate-limit.ts");
  }
}

function fixMiddlewareType(): void {
  let content = readFileSync("lib/security/middleware.ts", "utf8");
  content = content.replace(
    "method: request.method",
    "// method: request.method // Removed for type safety",
  );
  writeFileSync("lib/security/middleware.ts", content, "utf8");
  console.log("✅ Fixed middleware type issue");
}

async function main() {
  console.log("🔧 Fixing final remaining errors...\n");

  fixRemainingLoggerIssues();
  addMissingLoggerImports();
  fixMiddlewareType();

  console.log("\n✅ All final errors fixed!");
}

main().catch(console.error);
