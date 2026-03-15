#!/usr/bin/env tsx

/**
 * Script to replace all console.log statements with proper SecureLogger calls
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import path from "path";

interface LogReplacement {
  pattern: RegExp;
  replacement: string;
}

const logReplacements: LogReplacement[] = [
  // console.log -> logger.info
  {
    pattern: /console\.log\(/g,
    replacement: "logger.info(",
  },
  // console.error -> logger.error
  {
    pattern: /console\.error\(/g,
    replacement: "logger.error(",
  },
  // console.warn -> logger.warn
  {
    pattern: /console\.warn\(/g,
    replacement: "logger.warn(",
  },
  // console.debug -> logger.debug
  {
    pattern: /console\.debug\(/g,
    replacement: "logger.debug(",
  },
];

async function fixConsoleLogsInFile(filePath: string): Promise<boolean> {
  try {
    let content = readFileSync(filePath, "utf8");
    let hasChanges = false;

    // Check if file already imports logger
    const hasLoggerImport =
      content.includes("import { logger }") ||
      content.includes("import { SecureLogger }") ||
      content.includes("from '../security/secure-logger'") ||
      content.includes("from '../../security/secure-logger'") ||
      content.includes("from '../../../security/secure-logger'");

    // Apply replacements
    for (const { pattern, replacement } of logReplacements) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        hasChanges = true;
      }
    }

    // Add logger import if needed and changes were made
    if (hasChanges && !hasLoggerImport) {
      // Determine the correct import path based on file location
      const relativePath = path.relative(
        path.dirname(filePath),
        "lib/security/secure-logger",
      );
      const importPath = relativePath.startsWith(".")
        ? relativePath
        : `./${relativePath}`;

      // Find the last import statement
      const importRegex = /^import.*from.*['"];?\s*$/gm;
      const imports = content.match(importRegex);

      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const insertIndex = lastImportIndex + lastImport.length;

        content =
          content.slice(0, insertIndex) +
          `\nimport { logger } from '${importPath}';` +
          content.slice(insertIndex);
      } else {
        // No imports found, add at the top after any comments
        const lines = content.split("\n");
        let insertIndex = 0;

        // Skip shebang and comments at the top
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (
            line.startsWith("#!") ||
            line.startsWith("//") ||
            line.startsWith("/*") ||
            line === ""
          ) {
            insertIndex = i + 1;
          } else {
            break;
          }
        }

        lines.splice(
          insertIndex,
          0,
          `import { logger } from '${importPath}';`,
          "",
        );
        content = lines.join("\n");
      }
    }

    if (hasChanges) {
      writeFileSync(filePath, content, "utf8");
      console.log(`✅ Fixed console logs in: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

function getAllTsFiles(dir: string, excludePatterns: string[] = []): string[] {
  const files: string[] = [];

  function walkDir(currentDir: string) {
    try {
      const items = readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip excluded directories
          if (!excludePatterns.some((pattern) => fullPath.includes(pattern))) {
            walkDir(fullPath);
          }
        } else if (
          stat.isFile() &&
          item.endsWith(".ts") &&
          !item.endsWith(".test.ts") &&
          !item.endsWith(".spec.ts")
        ) {
          // Skip excluded files
          if (!excludePatterns.some((pattern) => fullPath.includes(pattern))) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  walkDir(dir);
  return files;
}

async function main() {
  console.log("🔧 Fixing console.log statements in production code...\n");

  // Get all TypeScript files from app/api and lib directories
  const excludePatterns = [
    "node_modules",
    ".next",
    "tests",
    "lib/security/secure-logger.ts",
  ];

  const apiFiles = getAllTsFiles("app/api", excludePatterns);
  const libFiles = getAllTsFiles("lib", excludePatterns);
  const allFiles = [...apiFiles, ...libFiles];

  let totalFiles = allFiles.length;
  let fixedFiles = 0;

  for (const file of allFiles) {
    const wasFixed = await fixConsoleLogsInFile(file);
    if (wasFixed) {
      fixedFiles++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Files with fixes: ${fixedFiles}`);
  console.log(`   Files unchanged: ${totalFiles - fixedFiles}`);

  if (fixedFiles > 0) {
    console.log("\n✅ Console log fixes completed!");
    console.log("🔍 Please review the changes and test the application.");
  } else {
    console.log("\n✅ No console logs found in production code.");
  }
}

main().catch(console.error);
