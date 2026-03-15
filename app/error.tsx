"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-100">
              <AlertTriangle className="h-16 w-16 text-red-600" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-4">
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">
              Something Went Wrong
            </h2>
            <p className="text-lg text-muted-foreground">
              We encountered an unexpected error. Don&apos;t worry, our team has
              been notified and we&apos;re working on it.
            </p>
            {error.digest && (
              <p className="text-sm text-muted-foreground">
                Error ID:{" "}
                <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
                  {error.digest}
                </code>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button onClick={reset} size="lg" className="gap-2">
              <RefreshCw className="h-5 w-5" />
              Try Again
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/">
                <Home className="h-5 w-5" />
                Go to Homepage
              </Link>
            </Button>
          </div>

          {/* Helpful Information */}
          <div className="mt-16 rounded-2xl border border-border/60 bg-white/80 p-6 sm:p-8">
            <h3 className="mb-4 font-semibold">What you can do:</h3>
            <div className="space-y-3 text-left text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  1
                </div>
                <p>Click &quot;Try Again&quot; to reload the page</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  2
                </div>
                <p>Check your internet connection</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  3
                </div>
                <p>
                  If the problem persists, contact{" "}
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

          {/* Back Link */}
          <div className="mt-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
