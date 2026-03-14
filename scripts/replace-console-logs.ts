#!/usr/bin/env tsx

/**
 * Script to replace console.log statements with secure logging
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = glob.sync('**/*.{ts,tsx}', {
  ignore: [
    'node_modules/**',
    '.next/**',
    'dist/**',
    'build/**',
    'scripts/replace-console-logs.ts',
    'lib/security/secure-logger.ts'
  ]
});

let totalReplacements = 0;

for (const file of files) {
  try {
    let content = readFileSync(file, 'utf8');
    let hasChanges = false;
    
    // Skip files that already import SecureLogger
    if (content.includes('SecureLogger') || content.includes('logger')) {
      continue;
    }
    
    // Count console.log occurrences
    const consoleLogMatches = content.match(/console\.log/g);
    if (!consoleLogMatches) {
      continue;
    }
    
    console.log(`Processing ${file} (${consoleLogMatches.length} console.log statements)`);
    
    // Add import at the top
    const importStatement = "import { logger } from '@/lib/security/secure-logger';\n";
    
    // Find the right place to insert the import
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find the last import statement
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].startsWith("import '") || lines[i].startsWith('import "')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() === '' && insertIndex > 0) {
        // Empty line after imports
        break;
      } else if (!lines[i].startsWith('//') && !lines[i].startsWith('/*') && !lines[i].startsWith('*') && lines[i].trim() !== '') {
        // Non-comment, non-empty line
        break;
      }
    }
    
    // Insert import
    lines.splice(insertIndex, 0, importStatement);
    content = lines.join('\n');
    hasChanges = true;
    
    // Replace console.log with logger.info
    content = content.replace(/console\.log\(/g, 'logger.info(');
    
    // Replace console.error with logger.error
    content = content.replace(/console\.error\(/g, 'logger.error(');
    
    // Replace console.warn with logger.warn
    content = content.replace(/console\.warn\(/g, 'logger.warn(');
    
    if (hasChanges) {
      writeFileSync(file, content);
      totalReplacements += consoleLogMatches.length;
    }
    
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
}

console.log(`\n✅ Replaced ${totalReplacements} console.log statements across ${files.length} files`);