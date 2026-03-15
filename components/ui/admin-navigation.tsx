"use client";

import {
  BarChart3,
  Users,
  CreditCard,
  Shield,
  LifeBuoy,
  TrendingUp,
  Settings,
} from "lucide-react";

import { ActiveNavigation } from "@/components/ui/active-navigation";

interface AdminNavigationProps {
  isSuper?: boolean;
  variant?: "horizontal" | "vertical" | "pills" | "sidebar";
  className?: string;
}

export function AdminNavigation({
  isSuper = false,
  variant = "sidebar",
  className = "",
}: AdminNavigationProps) {
  const navigationItems = [
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
    <ActiveNavigation
      items={navigationItems}
      variant={variant}
      className={className}
    />
  );
}
