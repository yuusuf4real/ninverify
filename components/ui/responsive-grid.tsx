"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
}

export const ResponsiveGrid = memo<ResponsiveGridProps>(
  ({
    children,
    cols = { default: 1, sm: 2, md: 3, lg: 4 },
    gap = "md",
    className = "",
    animate = false,
  }) => {
    const gapClasses = {
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
    };

    const getGridCols = () => {
      const classes = [];

      if (cols.default) classes.push(`grid-cols-${cols.default}`);
      if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
      if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
      if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
      if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);

      return classes.join(" ");
    };

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
        },
      },
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 24,
        },
      },
    };

    if (animate) {
      return (
        <motion.div
          className={cn("grid", getGridCols(), gapClasses[gap], className)}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {React.Children.map(children, (child, index) => (
            <motion.div key={index} variants={itemVariants}>
              {child}
            </motion.div>
          ))}
        </motion.div>
      );
    }

    return (
      <div className={cn("grid", getGridCols(), gapClasses[gap], className)}>
        {children}
      </div>
    );
  },
);

ResponsiveGrid.displayName = "ResponsiveGrid";

// Responsive card component
interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

export const ResponsiveCard = memo<ResponsiveCardProps>(
  ({ children, className = "", hover = true, padding = "md" }) => {
    const paddingClasses = {
      sm: "p-3 sm:p-4",
      md: "p-4 sm:p-6",
      lg: "p-6 sm:p-8",
    };

    return (
      <motion.div
        className={cn(
          "bg-white rounded-xl border border-gray-200 shadow-sm",
          paddingClasses[padding],
          hover && "hover:shadow-md transition-shadow duration-200",
          className,
        )}
        whileHover={hover ? { y: -2 } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        {children}
      </motion.div>
    );
  },
);

ResponsiveCard.displayName = "ResponsiveCard";

// Responsive container
interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
  padding?: boolean;
}

export const ResponsiveContainer = memo<ResponsiveContainerProps>(
  ({ children, maxWidth = "xl", className = "", padding = true }) => {
    const maxWidthClasses = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-7xl",
      "2xl": "max-w-2xl",
      full: "max-w-full",
    };

    return (
      <div
        className={cn(
          "mx-auto w-full",
          maxWidthClasses[maxWidth],
          padding && "px-4 sm:px-6 lg:px-8",
          className,
        )}
      >
        {children}
      </div>
    );
  },
);

ResponsiveContainer.displayName = "ResponsiveContainer";
