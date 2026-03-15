#!/usr/bin/env tsx

/**
 * Script to fix broken import statements caused by incorrect comma removal
 */

import { readFileSync, writeFileSync } from "fs";

interface ImportFix {
  file: string;
  brokenImport: RegExp;
  fixedImport: string;
}

const importFixes: ImportFix[] = [
  // API routes
  {
    file: "app/api/admin/dashboard/metrics/route.ts",
    brokenImport:
      /import { users walletTransactions, ninVerifications } from "@\/db\/schema";/,
    fixedImport:
      'import { users, walletTransactions, ninVerifications } from "@/db/schema";',
  },
  {
    file: "app/api/admin/dashboard/metrics/route.ts",
    brokenImport: /import { count, sum, eq, gte, and from "drizzle-orm";/,
    fixedImport: 'import { count, sum, eq, gte, and } from "drizzle-orm";',
  },
  {
    file: "app/api/admin/transactions/reconcile/route.ts",
    brokenImport: /import { eq from "drizzle-orm";/,
    fixedImport: 'import { eq } from "drizzle-orm";',
  },
  {
    file: "app/api/admin/transactions/route.ts",
    brokenImport: /import { walletTransactions, users from "@\/db\/schema";/,
    fixedImport: 'import { walletTransactions, users } from "@/db/schema";',
  },
  {
    file: "app/api/admin/transactions/route.ts",
    brokenImport:
      /import { eq and, gte, lte, desc, asc, count, sql from "drizzle-orm";/,
    fixedImport:
      'import { eq, gte, lte, desc, asc, count, sql } from "drizzle-orm";',
  },
  {
    file: "app/api/admin/users/route.ts",
    brokenImport:
      /import { eq and, gte, lte, desc, asc, count, sql } from "drizzle-orm";/,
    fixedImport:
      'import { eq, gte, lte, desc, asc, count, sql } from "drizzle-orm";',
  },
  {
    file: "app/api/admin/verifications/route.ts",
    brokenImport:
      /import { eq and, gte, lte, desc, asc, count, sql } from "drizzle-orm";/,
    fixedImport:
      'import { eq, gte, lte, desc, asc, count, sql } from "drizzle-orm";',
  },
  {
    file: "app/api/support/tickets/[id]/messages/route.ts",
    brokenImport: /import { eq, and isNull } from "drizzle-orm";/,
    fixedImport: 'import { eq, and, isNull } from "drizzle-orm";',
  },
  {
    file: "app/api/support/tickets/[id]/route.ts",
    brokenImport: /import { eq from "drizzle-orm";/,
    fixedImport: 'import { eq } from "drizzle-orm";',
  },
  {
    file: "app/api/support/tickets/route.ts",
    brokenImport: /import { eq, desc from "drizzle-orm";/,
    fixedImport: 'import { eq, desc } from "drizzle-orm";',
  },

  // Components
  {
    file: "components/organisms/reconciliation-modal.tsx",
    brokenImport:
      /import { Card, CardContent CardTitle } from "@\/components\/ui\/card";/,
    fixedImport: 'import { Card, CardContent } from "@/components/ui/card";',
  },
  {
    file: "components/organisms/ticket-conversation.tsx",
    brokenImport:
      /import  CardContent CardTitle } from "@\/components\/ui\/card";/,
    fixedImport: 'import { CardContent } from "@/components/ui/card";',
  },
  {
    file: "components/organisms/ticket-creation-wizard.tsx",
    brokenImport:
      /import { Card, CardContent CardTitle } from "@\/components\/ui\/card";/,
    fixedImport: 'import { Card, CardContent } from "@/components/ui/card";',
  },
  {
    file: "components/organisms/ticket-creation-wizard.tsx",
    brokenImport:
      /import  SelectContent SelectTrigger from "@\/components\/ui\/select";/,
    fixedImport:
      'import { SelectContent, SelectTrigger } from "@/components/ui/select";',
  },
  {
    file: "components/organisms/user-ticket-dashboard.tsx",
    brokenImport:
      /import { Card, CardContent CardTitle } from "@\/components\/ui\/card";/,
    fixedImport: 'import { Card, CardContent } from "@/components/ui/card";',
  },

  // Security files
  {
    file: "lib/security/auth-security.ts",
    brokenImport: /import  auditLogs } from '@\/db\/schema';/,
    fixedImport: "import { auditLogs } from '@/db/schema';",
  },
  {
    file: "lib/security/middleware.ts",
    brokenImport: /import  from '@\/lib\/security\/secure-logger';/,
    fixedImport: "", // Remove this broken import line entirely
  },
];

// Additional fixes for complex broken imports
const complexFixes: { [key: string]: string[] } = {
  "components/organisms/support-ticket-management-client.tsx": [
    "import {",
    "  Search,",
    "  Download,",
    "  Eye,",
    "  MessageSquare,",
    "  Clock,",
    "  AlertTriangle,",
    "  CheckCircle,",
    "  User,",
    "  Calendar,",
    "  ArrowUpDown",
    '} from "lucide-react";',
  ],
  "components/organisms/transaction-management-client.tsx": [
    "import {",
    "  Search,",
    "  Download,",
    "  Eye,",
    "  DollarSign,",
    "  Clock,",
    "  CheckCircle,",
    "  AlertTriangle,",
    "  User,",
    "  Calendar,",
    "  ArrowUpDown",
    '} from "lucide-react";',
  ],
  "components/organisms/user-detail-modal.tsx": [
    "import {",
    "  Mail,",
    "  Phone,",
    "  Calendar,",
    "  DollarSign,",
    "  Shield,",
    "  AlertTriangle",
    '} from "lucide-react";',
  ],
  "components/organisms/user-management-client.tsx": [
    "import {",
    "  Search,",
    "  Download,",
    "  Eye,",
    "  DollarSign,",
    "  Users",
    '} from "lucide-react";',
  ],
  "components/organisms/verification-management-client.tsx": [
    "import {",
    "  Search,",
    "  Download,",
    "  Eye,",
    "  CheckCircle,",
    "  AlertTriangle,",
    "  Clock,",
    "  TrendingUp,",
    "  User,",
    "  Calendar,",
    "  ArrowUpDown",
    '} from "lucide-react";',
  ],
};

function fixImports(filePath: string): boolean {
  try {
    let content = readFileSync(filePath, "utf8");
    let hasChanges = false;

    // Apply simple fixes
    for (const fix of importFixes.filter((f) => f.file === filePath)) {
      if (fix.brokenImport.test(content)) {
        content = content.replace(fix.brokenImport, fix.fixedImport);
        hasChanges = true;
        console.log(`✅ Fixed import in: ${filePath}`);
      }
    }

    // Apply complex fixes for lucide-react imports
    if (complexFixes[filePath]) {
      // Find and replace the broken lucide-react import section
      const lucideImportRegex =
        /import\s*{[^}]*}\s*from\s*["']lucide-react["'];?/s;
      if (lucideImportRegex.test(content)) {
        content = content.replace(
          lucideImportRegex,
          complexFixes[filePath].join("\n"),
        );
        hasChanges = true;
        console.log(`✅ Fixed complex lucide-react import in: ${filePath}`);
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
  console.log("🔧 Fixing broken import statements...\n");

  const filesToFix = [
    ...new Set([
      ...importFixes.map((f) => f.file),
      ...Object.keys(complexFixes),
    ]),
  ];

  let totalFixed = 0;

  for (const file of filesToFix) {
    const wasFixed = fixImports(file);
    if (wasFixed) {
      totalFixed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${filesToFix.length}`);
  console.log(`   Files with fixes: ${totalFixed}`);

  if (totalFixed > 0) {
    console.log("\n✅ Import fixes completed!");
  } else {
    console.log("\n✅ No import fixes needed.");
  }
}

main().catch(console.error);
