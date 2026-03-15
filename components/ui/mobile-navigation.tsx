"use client";

import React, { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface MobileNavigationProps {
  items: MobileNavItem[];
  className?: string;
}

export const MobileNavigation = memo<MobileNavigationProps>(
  ({ items, className = "" }) => {
    const pathname = usePathname();

    const normalizePath = (path: string) =>
      path === "/" ? "/" : path.replace(/\/+$/, "");

    const isActive = (href: string) => {
      const current = normalizePath(pathname);
      const target = normalizePath(href);

      if (target === "/") return current === target;
      if (current === target) return true;

      const isRootSection = target === "/dashboard" || target === "/admin";
      if (isRootSection) return false;

      return current.startsWith(`${target}/`);
    };

    return (
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden",
          className,
        )}
      >
        <div className="grid grid-cols-4 h-16">
          {items.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center px-2 py-2"
              >
                {/* Active indicator */}
                {active && (
                  <motion.div
                    className="absolute top-0 left-1/2 h-1 w-8 bg-primary rounded-b-full"
                    layoutId="mobileActiveIndicator"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={{ x: "-50%" }}
                  />
                )}

                {/* Icon container */}
                <motion.div
                  className={cn(
                    "relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <item.icon className="h-5 w-5" />

                  {/* Badge */}
                  {item.badge && (
                    <motion.span
                      className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center px-1"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </motion.div>

                {/* Label */}
                <span
                  className={cn(
                    "text-xs font-medium mt-1 transition-colors duration-200",
                    active ? "text-primary" : "text-gray-500",
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  },
);

MobileNavigation.displayName = "MobileNavigation";

// Bottom sheet component for mobile
interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const MobileBottomSheet = memo<MobileBottomSheetProps>(
  ({ isOpen, onClose, title, children }) => {
    const sheetVariants = {
      hidden: { y: "100%" },
      visible: { y: 0 },
    };

    const overlayVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    };

    if (!isOpen) return null;

    return (
      <>
        {/* Overlay */}
        <motion.div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 max-h-[80vh] overflow-hidden md:hidden"
          variants={sheetVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Handle */}
          <div className="flex justify-center py-3">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Header */}
          {title && (
            <div className="px-6 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
            {children}
          </div>
        </motion.div>
      </>
    );
  },
);

MobileBottomSheet.displayName = "MobileBottomSheet";
