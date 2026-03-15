"use client";

import React, { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
}

interface ActiveNavigationProps {
  items: NavigationItem[];
  variant?: "horizontal" | "vertical" | "pills" | "sidebar";
  className?: string;
  activeClassName?: string;
  itemClassName?: string;
}

export const ActiveNavigation = memo<ActiveNavigationProps>(
  ({
    items,
    variant = "horizontal",
    className = "",
    activeClassName = "",
    itemClassName = "",
  }) => {
    const pathname = usePathname();

    const isActive = (href: string) => {
      if (href === "/") return pathname === href;
      return pathname.startsWith(href);
    };

    const getVariantStyles = () => {
      switch (variant) {
        case "vertical":
          return {
            container: "flex flex-col space-y-1",
            item: "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            active: "bg-primary text-white shadow-lg shadow-primary/25",
            inactive: "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
          };
        case "pills":
          return {
            container:
              "flex items-center gap-2 rounded-full border border-border/70 bg-white/90 px-3 py-2 shadow-sm",
            item: "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200",
            active: "bg-primary text-white shadow-md",
            inactive: "text-foreground hover:bg-muted/70",
          };
        case "sidebar":
          return {
            container: "space-y-1",
            item: "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative",
            active: "bg-primary/10 text-primary border-r-2 border-primary",
            inactive: "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
          };
        default: // horizontal
          return {
            container: "flex items-center space-x-1",
            item: "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
            active: "bg-primary text-white shadow-md",
            inactive: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          };
      }
    };

    const styles = getVariantStyles();

    return (
      <nav className={cn(styles.container, className)}>
        {items.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.disabled ? "#" : item.href}
              className={cn(
                styles.item,
                active ? cn(styles.active, activeClassName) : styles.inactive,
                item.disabled && "opacity-50 cursor-not-allowed",
                itemClassName,
              )}
              onClick={item.disabled ? (e) => e.preventDefault() : undefined}
            >
              {/* Active indicator for sidebar variant */}
              {variant === "sidebar" && active && (
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
                  layoutId="activeIndicator"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              <item.icon
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  active && "scale-110",
                )}
              />

              <span className="truncate">{item.name}</span>

              {item.badge && (
                <motion.span
                  className={cn(
                    "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
                    active
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-700",
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {item.badge}
                </motion.span>
              )}

              {/* Hover effect */}
              {!active && (
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gray-100 opacity-0"
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    );
  },
);

ActiveNavigation.displayName = "ActiveNavigation";
