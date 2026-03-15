#!/usr/bin/env tsx

/**
 * Script to help migrate existing components to optimized versions
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { glob } from "glob";

interface ComponentMapping {
  old: string;
  new: string;
  path: string;
}

const COMPONENT_MAPPINGS: ComponentMapping[] = [
  {
    old: "SupportTicketManagementClient",
    new: "OptimizedSupportTicketManagement",
    path: "@/components/organisms/optimized-support-ticket-management",
  },
  {
    old: "UserManagementClient",
    new: "OptimizedUserManagement",
    path: "@/components/organisms/optimized-user-management",
  },
];

async function migrateComponents() {
  console.log("🔄 Component Migration Tool");
  console.log("===========================\n");

  // Find all TypeScript/TSX files
  const files = await glob("**/*.{ts,tsx}", {
    ignore: ["node_modules/**", ".next/**", "dist/**"],
  });

  console.log(`📁 Found ${files.length} files to analyze...\n`);

  let totalReplacements = 0;
  const modifiedFiles: string[] = [];

  for (const file of files) {
    if (!existsSync(file)) continue;

    try {
      const content = readFileSync(file, "utf-8");
      let newContent = content;
      let fileModified = false;

      for (const mapping of COMPONENT_MAPPINGS) {
        // Check for import statements
        const importRegex = new RegExp(
          `import\\s*{[^}]*\\b${mapping.old}\\b[^}]*}\\s*from\\s*["'][^"']*["']`,
          "g",
        );

        const componentUsageRegex = new RegExp(`<${mapping.old}\\b`, "g");

        // Replace import statements
        if (importRegex.test(content)) {
          newContent = newContent.replace(
            new RegExp(`\\b${mapping.old}\\b`, "g"),
            mapping.new,
          );

          // Update import path if it's from the old location
          newContent = newContent.replace(
            /from\s*["']@\/components\/organisms\/[^"']*-client["']/g,
            `from "${mapping.path}"`,
          );

          fileModified = true;
        }

        // Replace component usage
        if (componentUsageRegex.test(content)) {
          newContent = newContent.replace(
            new RegExp(`<${mapping.old}\\b`, "g"),
            `<${mapping.new}`,
          );

          newContent = newContent.replace(
            new RegExp(`</${mapping.old}>`, "g"),
            `</${mapping.new}>`,
          );

          fileModified = true;
        }
      }

      if (fileModified) {
        writeFileSync(file, newContent, "utf-8");
        modifiedFiles.push(file);
        totalReplacements++;
        console.log(`✅ Updated: ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`===================`);
  console.log(`Files analyzed: ${files.length}`);
  console.log(`Files modified: ${totalReplacements}`);
  console.log(`Components migrated: ${COMPONENT_MAPPINGS.length}`);

  if (modifiedFiles.length > 0) {
    console.log(`\n📝 Modified files:`);
    modifiedFiles.forEach((file) => console.log(`   - ${file}`));

    console.log(`\n⚠️  Important Notes:`);
    console.log(`- Review all changes before committing`);
    console.log(`- Test the application thoroughly`);
    console.log(`- Update any custom props or configurations`);
    console.log(`- Consider updating tests that reference old components`);

    console.log(`\n🚀 Next Steps:`);
    console.log(`1. Run: npm run type-check`);
    console.log(`2. Run: npm run lint`);
    console.log(`3. Run: npm run test`);
    console.log(`4. Test the application manually`);
    console.log(`5. Commit the changes`);
  } else {
    console.log(`\n✨ No components found that need migration!`);
  }
}

// Additional utility functions
function generateMigrationReport() {
  console.log(`\n📋 Migration Benefits:`);
  console.log(`=====================`);
  console.log(`✅ Improved performance with React.memo`);
  console.log(`✅ Better state management with Zustand`);
  console.log(`✅ Optimized data fetching with caching`);
  console.log(`✅ Reduced re-renders with memoization`);
  console.log(`✅ Virtual scrolling for large lists`);
  console.log(`✅ Debounced search inputs`);
  console.log(`✅ Error boundaries and loading states`);
  console.log(`✅ Performance monitoring integration`);
}

function checkDependencies() {
  console.log(`\n🔍 Checking Dependencies:`);
  console.log(`========================`);

  try {
    const packageJson = JSON.parse(readFileSync("package.json", "utf-8"));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const requiredDeps = ["zustand", "react"];
    const missingDeps = requiredDeps.filter((dep) => !dependencies[dep]);

    if (missingDeps.length > 0) {
      console.log(`❌ Missing dependencies: ${missingDeps.join(", ")}`);
      console.log(`   Run: npm install ${missingDeps.join(" ")}`);
    } else {
      console.log(`✅ All required dependencies are installed`);
    }
  } catch (error) {
    console.error(`❌ Error checking dependencies:`, error);
  }
}

// Run the migration
async function main() {
  checkDependencies();
  await migrateComponents();
  generateMigrationReport();
}

main().catch(console.error);
