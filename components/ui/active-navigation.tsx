"use client";

import React, { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  disabled?: boolean;
}

interface ActiveNavigationProps {
  items: NavigationItem[];
  variant?: "horizontal" | "vertical" | "pills" | "sidebar";
  className?: string;
  activeClassName?: string;
  itemClassName?: string;
  iconClassName?: string;
}

const variantConfig = {
  horizontal: {
    container: "flex items-center gap-2 rounded-full border border-border/70 bg-white/90 px-3 py-2 shadow-sm",
    item: "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200",
    activeItem: "bg-primary text-primary-foreground shadow-sm",
    inactiveItem: "text-foreground hover:bg-muted/70",
    icon: "h-4 w-4",
  },
  vertical: {
    container: "space-y-1",
    item: "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
    activeItem: "bg-primary text-primary-foreground shadow-sm",
    inactiveItem: "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
    icon: "h-5 w-5",
  },
  pills: {
    container: "flex items-center gap-3 py-3",
    item: "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200",
    activeItem: "bg-primary text-primary-foreground",
    inactiveItem: "bg-white text-foreground hover:bg-gray-50",
    icon: "h-4 w-4",
  },
  sidebar: {
    container: "space-y-1",
    item: "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative",
    activeItem: "bg-primary/10 text-primary border-r-2 border-primary",
    inactiveItem: "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
    icon: "h-5 w-5",
  },
};

export const ActiveNavigation = memo<ActiveNavigationProps>(
  ({
    items,
    variant = "horizontal",
    className = "",
    activeClassName = "",
    itemClassName = "",
    iconClassName = "",
  }) => {
    const pathname = usePathname();
    const config = variantConfig[variant];

    const isActive = (href: string) => {
      if (href === "/") return pathname === "/";
      if (href === "/admin") return pathname === "/admin";
      if (href === "/dashboard") return pathname === "/dashboard";
      return pathname.startsWith(href);
    };

    return (
      <nav className={cn(config.container, className)}>
        {items.map((item) => {
          const active = isActive(item.href);
          const IconComponent = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                config.item,
                active
                  ? cn(config.activeItem, activeClassName)
                  : config.inactiveItem,
                item.disabled && "opacity-50 cursor-not-allowed",
                itemClassName,
              )}
              aria-current={active ? "page" : undefined}
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

              {IconComponent && (
                <IconComponent
                  className={cn(
                    config.icon,
                    active ? "text-current" : "text-current opacity-70",
                    iconClassName,
                  )}
                />
              )}
              
              <span className="truncate">{item.name}</span>
              
              {item.badge && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    );
  },
);

ActiveNavigation.displayName = "ActiveNavigation";

// Mobile Navigation Component
interface MobileNavigationProps {
  items: NavigationItem[];
  className?: string;
}

export const MobileNavigation = memo<MobileNavigationProps>(
  ({ items, className = "" }) => {
    const pathname = usePathname();

    const isActive = (href: string) => {
      if (href === "/") return pathname === "/";
      if (href === "/admin") return pathname === "/admin";
      if (href === "/dashboard") return pathname === "/dashboard";
      return pathname.startsWith(href);
    };

    return (
      <nav className={cn("border-b border-border/70 bg-white/80 backdrop-blur", className)}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 py-3 overflow-x-auto">
            {items.map((item) => {
              const active = isActive(item.href);
              const IconComponent = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 whitespace-nowrap",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-white text-foreground hover:bg-gray-50",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {IconComponent && <IconComponent className="h-4 w-4" />}
                  {item.name}
                  {item.badge && (
                    <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    );
  },
);

MobileNavigation.displayName = "MobileNavigation";

// Breadcrumb Navigation Component
interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const BreadcrumbNavigation = memo<BreadcrumbNavigationProps>(
  ({ items, className = "" }) => (
    <nav className={cn("flex items-center space-x-2 text-sm", className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-gray-400">/</span>
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              {item.name}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.name}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  ),
);

BreadcrumbNavigation.displayName = "BreadcrumbNavigation";