"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: "white" | "primary" | "muted";
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-3",
};

const colorClasses = {
  white: "border-white/30 border-t-white",
  primary: "border-primary/30 border-t-primary",
  muted: "border-muted-foreground/30 border-t-muted-foreground",
};

export function LoadingSpinner({
  size = "md",
  className,
  color = "white",
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full",
        sizeClasses[size],
        colorClasses[color],
        className,
      )}
    />
  );
}
