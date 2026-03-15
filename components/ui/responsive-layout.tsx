"use client";

import React, { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
  sidebarWidth?: string;
  collapsible?: boolean;
}

export const ResponsiveLayout = memo<ResponsiveLayoutProps>(
  ({
    children,
    sidebar,
    header,
    className = "",
    sidebarWidth = "w-64",
    collapsible = true,
  }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
        if (window.innerWidth >= 768) {
          setSidebarOpen(false);
        }
      };

      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const sidebarVariants = {
      open: {
        x: 0,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30,
        },
      },
      closed: {
        x: "-100%",
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30,
        },
      },
    };

    const overlayVariants = {
      open: { opacity: 1 },
      closed: { opacity: 0 },
    };

    return (
      <div className={cn("relative min-h-screen bg-gray-50", className)}>
        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.div
              className="fixed inset-0 z-40 bg-black/50"
              variants={overlayVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        {sidebar && (
          <>
            {/* Desktop sidebar */}
            <div
              className={cn(
                "hidden md:fixed md:inset-y-0 md:left-0 md:z-50 md:block",
                sidebarWidth,
              )}
            >
              <div className="flex h-full flex-col bg-white shadow-lg">
                {sidebar}
              </div>
            </div>

            {/* Mobile sidebar */}
            <AnimatePresence>
              {isMobile && sidebarOpen && (
                <motion.div
                  className={cn("fixed inset-y-0 left-0 z-50", sidebarWidth)}
                  variants={sidebarVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                >
                  <div className="flex h-full flex-col bg-white shadow-lg">
                    {/* Close button */}
                    <div className="flex items-center justify-between p-4 border-b">
                      <h2 className="text-lg font-semibold">Menu</h2>
                      <button
                        onClick={() => setSidebarOpen(false)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    {sidebar}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Main content */}
        <div className={cn(sidebar && !isMobile && "md:pl-64")}>
          {/* Header */}
          {header && (
            <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between px-4 py-4">
                {/* Mobile menu button */}
                {sidebar && collapsible && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                )}

                <div className="flex-1">{header}</div>
              </div>
            </header>
          )}

          {/* Page content */}
          <main className="flex-1">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  },
);

ResponsiveLayout.displayName = "ResponsiveLayout";
