import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { ADMIN_SECURITY_CONFIG } from "@/lib/security/admin-security";
import { EnhancedAdminLayout } from "@/components/layouts/enhanced-admin-layout";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Skip authentication check for login page - it has its own layout
  const session = await getSession();

  if (
    !session ||
    (session.role !== "admin" && session.role !== "super_admin")
  ) {
    redirect(ADMIN_SECURITY_CONFIG.ADMIN_LOGIN_PATH);
  }

  return (
    <EnhancedAdminLayout
      user={{
        fullName: session.fullName || undefined,
        email: session.email,
        role: session.role,
      }}
    >
      {children}
    </EnhancedAdminLayout>
  );
}
