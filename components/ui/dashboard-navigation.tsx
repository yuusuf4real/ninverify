"use client";

import { History, RefreshCw, Wallet, MessageSquare } from "lucide-react";

import { ActiveNavigation } from "@/components/ui/active-navigation";
import { MobileNavigation } from "@/components/ui/mobile-navigation";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: Wallet },
  { name: "History", href: "/dashboard/transactions", icon: History },
  { name: "Recovery", href: "/dashboard/recovery", icon: RefreshCw },
  { name: "Support", href: "/dashboard/support", icon: MessageSquare },
];

interface DashboardNavigationProps {
  variant?: "horizontal" | "vertical" | "pills" | "sidebar";
  className?: string;
}

export function DashboardNavigation({
  variant = "horizontal",
  className = "",
}: DashboardNavigationProps) {
  return (
    <ActiveNavigation
      items={navigationItems}
      variant={variant}
      className={className}
    />
  );
}

interface DashboardMobileNavigationProps {
  className?: string;
}

export function DashboardMobileNavigation({
  className = "",
}: DashboardMobileNavigationProps) {
  return <MobileNavigation items={navigationItems} className={className} />;
}
