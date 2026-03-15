import React, { memo } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: "text" | "circular" | "rectangular";
  animation?: "pulse" | "wave" | "none";
}

const SkeletonComponent = ({
  className,
  width,
  height,
  variant = "rectangular",
  animation = "pulse",
}: SkeletonProps) => {
  const baseClasses = "bg-gray-200 dark:bg-gray-700";

  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-md",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-pulse", // Could be enhanced with custom wave animation
    none: "",
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className,
      )}
      style={{
        width: width || "100%",
        height: height || (variant === "text" ? "1em" : "auto"),
      }}
    />
  );
};

export const Skeleton = memo(SkeletonComponent);

// Pre-built skeleton components for common use cases
export const TableSkeleton = memo(function TableSkeleton({
  rows = 5,
}: {
  rows?: number;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton width={40} height={40} variant="circular" />
          <div className="flex-1 space-y-2">
            <Skeleton height={16} width="60%" />
            <Skeleton height={14} width="40%" />
          </div>
          <Skeleton width={80} height={32} />
        </div>
      ))}
    </div>
  );
});

export const CardSkeleton = memo(function CardSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton width={48} height={48} variant="circular" />
        <div className="flex-1 space-y-2">
          <Skeleton height={20} width="70%" />
          <Skeleton height={16} width="50%" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton height={16} />
        <Skeleton height={16} width="80%" />
        <Skeleton height={16} width="60%" />
      </div>
    </div>
  );
});

export const ListSkeleton = memo(function ListSkeleton({
  items = 8,
}: {
  items?: number;
}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3">
          <Skeleton width={24} height={24} variant="circular" />
          <div className="flex-1 space-y-1">
            <Skeleton height={14} width="40%" />
            <Skeleton height={12} width="60%" />
          </div>
          <Skeleton width={60} height={20} />
        </div>
      ))}
    </div>
  );
});
