"use client";

import React, { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
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

import { ResponsiveLayout } from "@/components/ui/responsive-layout";
import { ActiveNavigation } from "@/components/ui/active-navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminLogoutButton } from "@/components/organisms/admin-logout-button";

interface EnhancedAdminLayoutProps {
  children: React.ReactNode;
  user: {
    fullName?: string;
    email: string;
    role: string;
  };
}

export const EnhancedAdminLayout = memo<EnhancedAdminLayoutProps>(
  ({ children, user }) => {
    const displayName = user.fullName || user.email;
    const isSuper = user.role === "super_admin";

    const navigationItems = [
      { name: "Dashboard", href: "/admin", icon: BarChart3 },
      { name: "Users", href: "/admin/users", icon: Users, badge: "1.2k" },
      { name: "Transactions", href: "/admin/transactions", icon: CreditCard },
      { name: "Verifications", href: "/admin/verifications", icon: Shield },
      { name: "Support", href: "/admin/support", icon: LifeBuoy, badge: "5" },
      { name: "Analytics", href: "/admin/analytics", icon: TrendingUp },
      ...(isSuper
        ? [{ name: "System", href: "/admin/system", icon: Settings }]
        : []),
    ];

    const Sidebar = () => (
      <>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <motion.div
            className="relative h-10 w-10 overflow-hidden rounded-xl bg-primary/10"
            whileHover={{ scale: 1.05, rotate: 3 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Image
              src="/images/logo-mark.svg"
              alt="VerifyNIN"
              fill
              className="object-contain"
            />
          </motion.div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">VerifyNIN</h1>
            <p className="text-xs text-gray-500">Admin Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-6">
          <ActiveNavigation
            items={navigationItems}
            variant="sidebar"
            className="space-y-2"
          />
        </div>

        {/* User Profile */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-4">
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
                {user.role.replace("_", " ")}
              </p>
            </div>
          </div>

          <AdminLogoutButton />
        </div>
      </>
    );

    const Header = () => (
      <div className="flex items-center justify-between w-full">
        {/* Mobile logo */}
        <Link href="/admin" className="flex items-center gap-3 md:hidden">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-primary/10">
            <Image
              src="/images/logo-mark.svg"
              alt="VerifyNIN"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-semibold text-gray-900">Admin</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-lg mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search users, transactions..."
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-red-500" />
          </Button>

          {/* Quick Actions */}
          <Button size="sm" className="hidden sm:flex">
            Manage Users
          </Button>
        </div>
      </div>
    );

    return (
      <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/3 blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -right-40 bottom-20 h-80 w-80 rounded-full bg-blue-500/3 blur-3xl"
            animate={{
              scale: [1.1, 1, 1.1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <ResponsiveLayout
          sidebar={<Sidebar />}
          header={<Header />}
          className="relative z-10"
        >
          {children}
        </ResponsiveLayout>
      </div>
    );
  },
);

EnhancedAdminLayout.displayName = "EnhancedAdminLayout";
