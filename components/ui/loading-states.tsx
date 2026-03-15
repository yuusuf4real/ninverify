import React, { memo } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { AnimatedLogoLoader } from "@/components/ui/animated-logo-loader";
import { cn } from "@/lib/utils";

// Global loading overlay with animated logo
export const LoadingOverlay = memo(
  ({ show, message = "Loading..." }: { show: boolean; message?: string }) => {
    if (!show) return null;

    return (
      <AnimatedLogoLoader
        show={show}
        variant="overlay"
        size="lg"
        message={message}
      />
    );
  },
);

LoadingOverlay.displayName = "LoadingOverlay";

// Inline loading spinner
export const LoadingSpinner = memo(
  ({
    size = "default",
    className = "",
  }: {
    size?: "sm" | "default" | "lg";
    className?: string;
  }) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      default: "h-6 w-6",
      lg: "h-8 w-8",
    };

    return (
      <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
    );
  },
);

LoadingSpinner.displayName = "LoadingSpinner";

// Loading button state
export const LoadingButton = memo(
  ({
    loading,
    children,
    loadingText = "Loading...",
    className = "",
    ...props
  }: {
    loading: boolean;
    children: React.ReactNode;
    loadingText?: string;
    className?: string;
    [key: string]: unknown;
  }) => (
    <Button
      disabled={loading}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      {loading && <AnimatedLogoLoader size="sm" variant="inline" />}
      {loading ? loadingText : children}
    </Button>
  ),
);

LoadingButton.displayName = "LoadingButton";

// Empty state component
export const EmptyState = memo(
  ({
    icon: Icon,
    title,
    description,
    action,
    className = "",
  }: {
    icon?: React.ComponentType<{ className?: string }>;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
  }) => (
    <div className={cn("text-center py-12", className)}>
      {Icon && <Icon className="h-12 w-12 mx-auto text-gray-400 mb-4" />}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action}
    </div>
  ),
);

EmptyState.displayName = "EmptyState";

// Error state component
export const ErrorState = memo(
  ({
    title = "Something went wrong",
    description = "We encountered an error while loading this content.",
    onRetry,
    className = "",
  }: {
    title?: string;
    description?: string;
    onRetry?: () => void;
    className?: string;
  }) => (
    <div className={cn("text-center py-12", className)}>
      <div className="h-12 w-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
        <RefreshCw className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  ),
);

ErrorState.displayName = "ErrorState";

// Page loading component with animated logo
export const PageLoading = memo(
  ({ message = "Loading page..." }: { message?: string }) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <AnimatedLogoLoader size="xl" message={message} className="text-center" />
    </div>
  ),
);

PageLoading.displayName = "PageLoading";

// Content loading with skeleton
export const ContentLoading = memo(
  ({
    type = "list",
    rows = 5,
  }: {
    type?: "list" | "table" | "cards" | "form";
    rows?: number;
  }) => {
    switch (type) {
      case "table":
        return (
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex space-x-4 p-4 border rounded">
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

      case "cards":
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: rows }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="space-y-3">
                  <Skeleton height={20} width="70%" />
                  <Skeleton height={16} />
                  <Skeleton height={16} width="80%" />
                  <div className="flex justify-between">
                    <Skeleton width={60} height={24} />
                    <Skeleton width={80} height={32} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );

      case "form":
        return (
          <div className="space-y-6 max-w-md">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton height={16} width="30%" />
                <Skeleton height={40} />
              </div>
            ))}
            <Skeleton height={40} width="40%" />
          </div>
        );

      default: // list
        return (
          <div className="space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
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
    }
  },
);

ContentLoading.displayName = "ContentLoading";
