"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatErrorForUser } from "@/lib/errors/error-messages";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 *
 * Catches React errors and displays a user-friendly error message
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorDetails = formatErrorForUser(this.state.error);

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-4 sm:p-8">
          <div className="mx-auto max-w-md text-center">
            {/* Error Icon */}
            <div className="mb-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 ring-4 ring-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold sm:text-2xl">
                {errorDetails.title}
              </h3>
              <p className="text-sm text-muted-foreground sm:text-base">
                {errorDetails.message}
              </p>
              {errorDetails.helpText && (
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {errorDetails.helpText}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={this.handleReset}
                size="lg"
                className="gap-2 touch-manipulation"
              >
                <RefreshCw className="h-4 w-4" />
                {errorDetails.action || "Try Again"}
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="gap-2 touch-manipulation"
              >
                <Link href="/">
                  <Home className="h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            </div>

            {/* Help Text */}
            <div className="mt-8 rounded-lg border border-border/60 bg-muted/30 p-4 text-left">
              <p className="text-xs text-muted-foreground">
                If this problem persists, please contact support at{" "}
                <a
                  href="mailto:support@verifynin.ng"
                  className="font-semibold text-primary hover:underline"
                >
                  support@verifynin.ng
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
