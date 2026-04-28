"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw, Mail, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatErrorForUser } from "@/lib/errors/error-messages";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const errorDetails = formatErrorForUser(error);

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-32 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute -right-28 top-10 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          {/* Error Visual */}
          <div className="mb-8">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-100 sm:h-32 sm:w-32">
              <AlertTriangle className="h-12 w-12 text-red-600 sm:h-16 sm:w-16" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl md:text-4xl">
              {errorDetails.title}
            </h2>
            <p className="text-base text-muted-foreground sm:text-lg">
              {errorDetails.message}
            </p>
            {errorDetails.helpText && (
              <p className="text-sm text-muted-foreground">
                {errorDetails.helpText}
              </p>
            )}
            {error.digest && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Error ID:{" "}
                  <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
                    {error.digest}
                  </code>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Please include this ID when contacting support
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
            <Button
              onClick={reset}
              size="lg"
              className="gap-2 touch-manipulation"
            >
              <RefreshCw className="h-5 w-5" />
              {errorDetails.action || "Try Again"}
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="gap-2 touch-manipulation"
            >
              <Link href="/">
                <Home className="h-5 w-5" />
                Go to Homepage
              </Link>
            </Button>
          </div>

          {/* Helpful Information */}
          <div className="mt-12 rounded-2xl border border-border/60 bg-white/80 p-6 text-left sm:mt-16 sm:p-8">
            <div className="mb-4 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">What you can do:</h3>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  1
                </div>
                <p>
                  Click &quot;{errorDetails.action || "Try Again"}&quot; to
                  retry the operation
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  2
                </div>
                <p>Check your internet connection and refresh the page</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  3
                </div>
                <p>Clear your browser cache and cookies</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  4
                </div>
                <div>
                  <p>Still having issues? Contact our support team</p>
                  <a
                    href="mailto:support@verifynin.ng"
                    className="mt-1 inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    <Mail className="h-3 w-3" />
                    support@verifynin.ng
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Support Link */}
          {errorDetails.supportLink && (
            <div className="mt-6">
              <Link
                href={errorDetails.supportLink}
                className="text-sm text-primary hover:underline"
              >
                Check System Status →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
