"use client";

import React, { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EnhancedCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "outlined" | "glass" | "gradient";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

interface EnhancedCardHeaderProps {
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

interface EnhancedCardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface EnhancedCardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const variantConfig = {
  default: {
    base: "bg-white border border-gray-200 shadow-sm",
    hover: "hover:shadow-md hover:border-gray-300",
  },
  elevated: {
    base: "bg-white border border-gray-100 shadow-lg",
    hover: "hover:shadow-xl hover:border-gray-200",
  },
  outlined: {
    base: "bg-white border-2 border-gray-200",
    hover: "hover:border-gray-300 hover:shadow-sm",
  },
  glass: {
    base: "bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-lg",
    hover: "hover:bg-white hover:shadow-xl hover:border-gray-300/50",
  },
  gradient: {
    base: "bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm",
    hover:
      "hover:from-white hover:to-blue-50 hover:shadow-md hover:border-blue-200",
  },
};

const paddingConfig = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
  xl: "p-8",
};

export const EnhancedCard = memo<EnhancedCardProps>(
  ({
    children,
    className = "",
    variant = "default",
    padding = "md",
    hover = false,
    clickable = false,
    onClick,
  }) => {
    const config = variantConfig[variant];
    const paddingClass = paddingConfig[padding];

    const cardProps = {
      className: cn(
        "rounded-xl transition-all duration-200",
        config.base,
        hover && config.hover,
        clickable && "cursor-pointer",
        paddingClass,
        className,
      ),
      ...(clickable && onClick && { onClick }),
    };

    if (hover || clickable) {
      return (
        <motion.div
          {...cardProps}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      );
    }

    return <div {...cardProps}>{children}</div>;
  },
);

EnhancedCard.displayName = "EnhancedCard";

export const EnhancedCardHeader = memo<EnhancedCardHeaderProps>(
  ({ children, className = "", actions }) => (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <div className="flex-1 min-w-0">{children}</div>
      {actions && <div className="flex items-center gap-2 ml-4">{actions}</div>}
    </div>
  ),
);

EnhancedCardHeader.displayName = "EnhancedCardHeader";

export const EnhancedCardContent = memo<EnhancedCardContentProps>(
  ({ children, className = "" }) => (
    <div className={cn("text-gray-700", className)}>{children}</div>
  ),
);

EnhancedCardContent.displayName = "EnhancedCardContent";

export const EnhancedCardFooter = memo<EnhancedCardFooterProps>(
  ({ children, className = "" }) => (
    <div className={cn("mt-4 pt-4 border-t border-gray-100", className)}>
      {children}
    </div>
  ),
);

EnhancedCardFooter.displayName = "EnhancedCardFooter";

// Status Card Component
interface StatusCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "gray";
  className?: string;
}

const colorConfig = {
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    text: "text-blue-900",
    trend: "text-blue-600",
  },
  green: {
    bg: "bg-green-50",
    icon: "text-green-600",
    text: "text-green-900",
    trend: "text-green-600",
  },
  yellow: {
    bg: "bg-yellow-50",
    icon: "text-yellow-600",
    text: "text-yellow-900",
    trend: "text-yellow-600",
  },
  red: {
    bg: "bg-red-50",
    icon: "text-red-600",
    text: "text-red-900",
    trend: "text-red-600",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-600",
    text: "text-purple-900",
    trend: "text-purple-600",
  },
  gray: {
    bg: "bg-gray-50",
    icon: "text-gray-600",
    text: "text-gray-900",
    trend: "text-gray-600",
  },
};

export const StatusCard = memo<StatusCardProps>(
  ({
    title,
    value,
    icon: IconComponent,
    trend,
    color = "blue",
    className = "",
  }) => {
    const colors = colorConfig[color];

    return (
      <EnhancedCard variant="elevated" hover className={className}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className={cn("text-2xl font-bold", colors.text)}>{value}</p>
            {trend && (
              <p className={cn("text-sm font-medium mt-1", colors.trend)}>
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-lg", colors.bg)}>
            <IconComponent className={cn("h-6 w-6", colors.icon)} />
          </div>
        </div>
      </EnhancedCard>
    );
  },
);

StatusCard.displayName = "StatusCard";

// Info Card Component
interface InfoCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  className?: string;
}

export const InfoCard = memo<InfoCardProps>(
  ({
    title,
    description,
    children,
    icon: IconComponent,
    actions,
    className = "",
  }) => (
    <EnhancedCard variant="default" className={className}>
      <EnhancedCardHeader actions={actions}>
        <div className="flex items-center gap-3">
          {IconComponent && (
            <div className="p-2 bg-blue-50 rounded-lg">
              <IconComponent className="h-5 w-5 text-blue-600" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
      </EnhancedCardHeader>
      <EnhancedCardContent>{children}</EnhancedCardContent>
    </EnhancedCard>
  ),
);

InfoCard.displayName = "InfoCard";
