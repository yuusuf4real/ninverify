#!/usr/bin/env tsx

/**
 * Final comprehensive script to fix all validation issues
 */

import { readFileSync, writeFileSync } from "fs";

interface Fix {
  file: string;
  description: string;
  apply: () => boolean;
}

const fixes: Fix[] = [
  // 1. Fix missing imports in management components
  {
    file: "components/organisms/support-ticket-management-client.tsx",
    description: "Add missing RefreshCw and MoreHorizontal imports",
    apply: () => {
      const content = readFileSync(
        "components/organisms/support-ticket-management-client.tsx",
        "utf8",
      );
      const newContent = content.replace(
        /import \{\s*Search,\s*Download,\s*Eye,\s*MessageSquare,\s*Clock,\s*AlertTriangle,\s*CheckCircle,\s*User,\s*Calendar,\s*ArrowUpDown\s*\} from "lucide-react";/,
        `import {
  Search,
  Download,
  Eye,
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Calendar,
  ArrowUpDown,
  RefreshCw,
  MoreHorizontal
} from "lucide-react";`,
      );
      if (newContent !== content) {
        writeFileSync(
          "components/organisms/support-ticket-management-client.tsx",
          newContent,
          "utf8",
        );
        return true;
      }
      return false;
    },
  },

  // 2. Fix missing imports in transaction management
  {
    file: "components/organisms/transaction-management-client.tsx",
    description: "Add missing imports",
    apply: () => {
      const content = readFileSync(
        "components/organisms/transaction-management-client.tsx",
        "utf8",
      );
      const newContent = content.replace(
        /import \{\s*Search,\s*Download,\s*Eye,\s*DollarSign,\s*Clock,\s*CheckCircle,\s*AlertTriangle,\s*User,\s*Calendar,\s*ArrowUpDown\s*\} from "lucide-react";/,
        `import {
  Search,
  Download,
  Eye,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  ArrowUpDown,
  TrendingUp,
  RefreshCw,
  CreditCard,
  MoreHorizontal
} from "lucide-react";`,
      );
      if (newContent !== content) {
        writeFileSync(
          "components/organisms/transaction-management-client.tsx",
          newContent,
          "utf8",
        );
        return true;
      }
      return false;
    },
  },

  // 3. Fix missing imports in verification management
  {
    file: "components/organisms/verification-management-client.tsx",
    description: "Add missing imports",
    apply: () => {
      const content = readFileSync(
        "components/organisms/verification-management-client.tsx",
        "utf8",
      );
      const newContent = content.replace(
        /import \{\s*Search,\s*Download,\s*Eye,\s*CheckCircle,\s*AlertTriangle,\s*Clock,\s*TrendingUp,\s*User,\s*Calendar,\s*ArrowUpDown\s*\} from "lucide-react";/,
        `import {
  Search,
  Download,
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  User,
  Calendar,
  ArrowUpDown,
  Shield,
  XCircle,
  RefreshCw,
  MoreHorizontal
} from "lucide-react";`,
      );
      if (newContent !== content) {
        writeFileSync(
          "components/organisms/verification-management-client.tsx",
          newContent,
          "utf8",
        );
        return true;
      }
      return false;
    },
  },

  // 4. Fix missing 'and' imports in API routes
  {
    file: "app/api/admin/transactions/route.ts",
    description: "Add missing and import",
    apply: () => {
      const content = readFileSync(
        "app/api/admin/transactions/route.ts",
        "utf8",
      );
      const newContent = content.replace(
        /import { eq, gte, lte, desc, asc, count, sql } from "drizzle-orm";/,
        'import { eq, and, gte, lte, desc, asc, count, sql } from "drizzle-orm";',
      );
      if (newContent !== content) {
        writeFileSync(
          "app/api/admin/transactions/route.ts",
          newContent,
          "utf8",
        );
        return true;
      }
      return false;
    },
  },

  {
    file: "app/api/admin/users/route.ts",
    description: "Add missing and import",
    apply: () => {
      const content = readFileSync("app/api/admin/users/route.ts", "utf8");
      const newContent = content.replace(
        /import { eq, gte, lte, desc, asc, count, sql } from "drizzle-orm";/,
        'import { eq, and, gte, lte, desc, asc, count, sql } from "drizzle-orm";',
      );
      if (newContent !== content) {
        writeFileSync("app/api/admin/users/route.ts", newContent, "utf8");
        return true;
      }
      return false;
    },
  },

  {
    file: "app/api/admin/verifications/route.ts",
    description: "Add missing and import",
    apply: () => {
      const content = readFileSync(
        "app/api/admin/verifications/route.ts",
        "utf8",
      );
      const newContent = content.replace(
        /import { eq, gte, lte, desc, asc, count, sql } from "drizzle-orm";/,
        'import { eq, and, gte, lte, desc, asc, count, sql } from "drizzle-orm";',
      );
      if (newContent !== content) {
        writeFileSync(
          "app/api/admin/verifications/route.ts",
          newContent,
          "utf8",
        );
        return true;
      }
      return false;
    },
  },

  // 5. Fix useEffect dependency issues
  {
    file: "components/organisms/ticket-conversation.tsx",
    description: "Move useCallback before useEffect",
    apply: () => {
      let content = readFileSync(
        "components/organisms/ticket-conversation.tsx",
        "utf8",
      );

      // Find and extract the useCallback functions
      const fetchTicketDetailsMatch = content.match(
        /const fetchTicketDetails = useCallback\(async \(\) => \{[\s\S]*?\}, \[ticketId\]\);/,
      );
      const fetchMessagesMatch = content.match(
        /const fetchMessages = useCallback\(async \(\) => \{[\s\S]*?\}, \[ticketId\]\);/,
      );

      if (fetchTicketDetailsMatch && fetchMessagesMatch) {
        // Remove the functions from their current location
        content = content.replace(fetchTicketDetailsMatch[0], "");
        content = content.replace(fetchMessagesMatch[0], "");

        // Insert them before the useEffect
        const useEffectMatch = content.match(
          /useEffect\(\(\) => \{[\s\S]*?\}, \[ticketId, fetchTicketDetails, fetchMessages\]\);/,
        );
        if (useEffectMatch) {
          const insertPoint = content.indexOf(useEffectMatch[0]);
          const newContent =
            content.slice(0, insertPoint) +
            fetchTicketDetailsMatch[0] +
            "\n\n  " +
            fetchMessagesMatch[0] +
            "\n\n  " +
            content.slice(insertPoint);

          writeFileSync(
            "components/organisms/ticket-conversation.tsx",
            newContent,
            "utf8",
          );
          return true;
        }
      }
      return false;
    },
  },

  // 6. Fix useEffect dependency in user ticket dashboard
  {
    file: "components/organisms/user-ticket-dashboard.tsx",
    description: "Move useCallback before useEffect",
    apply: () => {
      let content = readFileSync(
        "components/organisms/user-ticket-dashboard.tsx",
        "utf8",
      );

      // Find and extract the useCallback function
      const fetchTicketsMatch = content.match(
        /const fetchTickets = useCallback\(async \(retryCount = 0\) => \{[\s\S]*?\}, \[\]\);/,
      );

      if (fetchTicketsMatch) {
        // Remove the function from its current location
        content = content.replace(fetchTicketsMatch[0], "");

        // Insert it before the useEffect
        const useEffectMatch = content.match(
          /useEffect\(\(\) => \{[\s\S]*?\}, \[fetchTickets\]\);/,
        );
        if (useEffectMatch) {
          const insertPoint = content.indexOf(useEffectMatch[0]);
          const newContent =
            content.slice(0, insertPoint) +
            fetchTicketsMatch[0] +
            "\n\n  " +
            content.slice(insertPoint);

          writeFileSync(
            "components/organisms/user-ticket-dashboard.tsx",
            newContent,
            "utf8",
          );
          return true;
        }
      }
      return false;
    },
  },

  // 7. Add missing logger imports
  {
    file: "lib/audit-log.ts",
    description: "Add logger import",
    apply: () => {
      const content = readFileSync("lib/audit-log.ts", "utf8");
      if (!content.includes("import { logger }")) {
        const newContent = content.replace(
          /import { db } from "@\/db\/client";/,
          `import { db } from "@/db/client";
import { logger } from "./security/secure-logger";`,
        );
        writeFileSync("lib/audit-log.ts", newContent, "utf8");
        return true;
      }
      return false;
    },
  },

  {
    file: "lib/rate-limit.ts",
    description: "Add logger import",
    apply: () => {
      const content = readFileSync("lib/rate-limit.ts", "utf8");
      if (!content.includes("import { logger }")) {
        const lines = content.split("\n");
        lines.splice(
          1,
          0,
          'import { logger } from "./security/secure-logger";',
        );
        writeFileSync("lib/rate-limit.ts", lines.join("\n"), "utf8");
        return true;
      }
      return false;
    },
  },

  // 8. Fix logger usage to use proper context objects
  {
    file: "lib/db-health.ts",
    description: "Fix logger context parameter",
    apply: () => {
      let content = readFileSync("lib/db-health.ts", "utf8");
      content = content.replace(
        /logger\.warn\("Database health check failed:", error\);/,
        'logger.warn("Database health check failed:", { error });',
      );
      writeFileSync("lib/db-health.ts", content, "utf8");
      return true;
    },
  },
];

async function main() {
  console.log("🔧 Applying final validation fixes...\n");

  let totalFixed = 0;

  for (const fix of fixes) {
    try {
      const wasFixed = fix.apply();
      if (wasFixed) {
        console.log(`✅ ${fix.description} in: ${fix.file}`);
        totalFixed++;
      }
    } catch (error) {
      console.error(`❌ Error applying fix for ${fix.file}:`, error);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total fixes attempted: ${fixes.length}`);
  console.log(`   Fixes applied: ${totalFixed}`);

  if (totalFixed > 0) {
    console.log("\n✅ Final validation fixes completed!");
    console.log("🔍 Run validation again to check remaining issues.");
  } else {
    console.log("\n✅ No fixes applied - files may already be correct.");
  }
}

main().catch(console.error);
