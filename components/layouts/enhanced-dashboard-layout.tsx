"use client";

import React, { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  History,
  UserCircle,
  Wallet,
  MessageSquare,
  Bell,
  Settings,
} from "lucide-react";

import { ResponsiveLayout } from "@/components/ui/responsive-layout";
import { ActiveNavigation } from "@/components/ui/active-navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/organisms/logout-button";

interface EnhancedDashboardLayoutProps {
  children: React.ReactNode;
  user: {
    fullName?: string;
    email: string;
    balance?: number;
  };
}

export const EnhancedDashboardLayout = memo<EnhancedDashboardLayoutProps>(
  ({ children, user }) => {
    const displayName = user.fullName || user.email;

    const navigationItems = [
      { name: "Dashboard", href: "/dashboard", icon: Wallet },
      { name: "History", href: "/dashboard/transactions", icon: History },
      {
        name: "Support",
        href: "/dashboard/support",
        icon: MessageSquare,
        badge: "2",
      },
    ];

    const Sidebar = () => (
      <>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <motion.div
            className="relative h-10 w-10 overflow-hidden rounded-2xl bg-white shadow-lg"
            whileHover={{ scale: 1.05, rotate: 3 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Image
              src="/images/logo-mark.svg"
              alt="VerifyNIN logo"
              fill
              className="object-contain"
            />
          </motion.div>
          <div className="space-y-1">
            <Image
              src="/images/logo-wordmark.svg"
              alt="VerifyNIN wordmark"
              width={120}
              height={28}
              className="h-5 w-auto"
            />
            <p className="text-xs text-gray-500">Dashboard</p>
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
              <UserCircle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-500">
                Balance: ₦{user.balance?.toLocaleString() || "0"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <LogoutButton />
          </div>
        </div>
      </>
    );

    const Header = () => (
      <div className="flex items-center justify-between w-full">
        {/* Mobile logo */}
        <Link href="/dashboard" className="flex items-center gap-3 md:hidden">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-white shadow-md">
            <Image
              src="/images/logo-mark.svg"
              alt="VerifyNIN logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-semibold text-gray-900">VerifyNIN</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex flex-1 justify-center">
          <ActiveNavigation items={navigationItems} variant="pills" />
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-red-500" />
          </Button>

          {/* User info (desktop) */}
          <div className="hidden lg:flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserCircle className="h-4 w-4" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500">
                ₦{user.balance?.toLocaleString() || "0"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            className="absolute -left-24 top-32 h-72 w-72 rounded-full bg-primary/5 blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -right-28 top-10 h-80 w-80 rounded-full bg-green-500/5 blur-3xl"
            animate={{
              scale: [1.1, 1, 1.1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.2, 0.4],
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

EnhancedDashboardLayout.displayName = "EnhancedDashboardLayout";
