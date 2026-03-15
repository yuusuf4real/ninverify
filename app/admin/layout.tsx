import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Users,
  CreditCard,
  Shield,
  LifeBuoy,
  TrendingUp,
  Settings,
  Bell,
  Search,
} from "lucide-react";

import { getSession } from "@/lib/auth";
import { AdminLogoutButton } from "@/components/organisms/admin-logout-button";
import { ActiveNavigation } from "@/components/ui/active-navigation";

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
    redirect("/admin-login");
  }

  const displayName = session.fullName || session.email;
  const isSuper = session.role === "super_admin";

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: BarChart3 },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Transactions", href: "/admin/transactions", icon: CreditCard },
    { name: "Verifications", href: "/admin/verifications", icon: Shield },
    { name: "Support", href: "/admin/support", icon: LifeBuoy },
    { name: "Analytics", href: "/admin/analytics", icon: TrendingUp },
    ...(isSuper
      ? [{ name: "System", href: "/admin/system", icon: Settings }]
      : []),
  ];

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-200">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-primary/10">
            <Image
              src="/images/logo-mark.svg"
              alt="VerifyNIN"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">VerifyNIN</h1>
            <p className="text-xs text-gray-500">Admin Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 px-3">
          <ActiveNavigation items={navigation} variant="sidebar" />
        </div>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-sm font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {session.role.replace("_", " ")}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <AdminLogoutButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users, transactions..."
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500"></span>
              </button>

              {/* Quick Actions */}
              <Link
                href="/admin/users"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
              >
                Manage Users
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
