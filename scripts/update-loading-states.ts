#!/usr/bin/env tsx

/**
 * Script to update remaining loading states to use consistent patterns
 */

import { readFileSync, writeFileSync } from "fs";
import { glob } from "glob";

async function updateLoadingStates() {
  console.log("🔄 Updating Loading States");
  console.log("==========================\n");

  // Find all TypeScript/TSX files
  const files = await glob("components/organisms/**/*.{ts,tsx}", {
    ignore: ["node_modules/**", ".next/**", "dist/**"],
  });

  console.log(`📁 Found ${files.length} files to update...\n`);

  let totalUpdates = 0;

  for (const file of files) {
    try {
      let content = readFileSync(file, "utf-8");
      let fileModified = false;

      // Update refresh button animations to be more subtle
      const refreshPattern =
        /className={`([^`]*)\$\{([^}]*)\s*\?\s*"animate-spin"\s*:\s*"([^"]*)"\}([^`]*)`}/g;
      if (refreshPattern.test(content)) {
        content = content.replace(
          refreshPattern,
          'className={`$1${$2 ? "opacity-50" : "$3"}$4`}',
        );
        fileModified = true;
      }

      // Update any remaining manual spinners to use consistent styling
      const manualSpinnerPattern =
        /<div className="[^"]*animate-spin[^"]*"[^>]*><\/div>/g;
      if (manualSpinnerPattern.test(content)) {
        content = content.replace(
          manualSpinnerPattern,
          '<AnimatedLogoLoader size="sm" variant="inline" />',
        );

        // Add import if not present
        if (!content.includes("AnimatedLogoLoader")) {
          const importPattern =
            /import { ([^}]+) } from "@\/components\/ui\/([^"]+)";/;
          const lastUIImport = content.match(importPattern);
          if (lastUIImport) {
            content = content.replace(
              lastUIImport[0],
              `${lastUIImport[0]}\nimport { AnimatedLogoLoader } from "@/components/ui/animated-logo-loader";`,
            );
          }
        }

        fileModified = true;
      }

      if (fileModified) {
        writeFileSync(file, content, "utf-8");
        totalUpdates++;
        console.log(`✅ Updated: ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }

  console.log(`\n📊 Update Summary:`);
  console.log(`=================`);
  console.log(`Files processed: ${files.length}`);
  console.log(`Files updated: ${totalUpdates}`);

  if (totalUpdates > 0) {
    console.log(
      `\n✨ Loading states have been updated to use the new animated logo loader!`,
    );
    console.log(`🔧 Remember to test the updated components.`);
  } else {
    console.log(`\n✨ All loading states are already up to date!`);
  }
}

updateLoadingStates().catch(console.error);
