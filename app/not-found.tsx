import Link from "next/link";
import { Home, Search, ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-28 top-10 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          {/* 404 Visual */}
          <div className="mb-8">
            <h1 className="font-heading text-[120px] font-bold leading-none text-primary/20 sm:text-[180px]">
              404
            </h1>
            <div className="-mt-16 sm:-mt-24">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 sm:h-32 sm:w-32">
                <Search className="h-12 w-12 text-primary sm:h-16 sm:w-16" />
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-4">
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">
              Page Not Found
            </h2>
            <p className="text-lg text-muted-foreground">
              We couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or the link might be incorrect.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/">
                <Home className="h-5 w-5" />
                Go to Homepage
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          {/* Helpful Links */}
          <div className="mt-16 rounded-2xl border border-border/60 bg-white/80 p-6 sm:p-8">
            <div className="mb-4 flex items-center justify-center gap-2 text-muted-foreground">
              <HelpCircle className="h-5 w-5" />
              <h3 className="font-semibold">Need Help?</h3>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <Link
                href="/support"
                className="rounded-lg border border-border/60 bg-white p-4 transition-colors hover:bg-muted/50"
              >
                <p className="font-semibold">Support</p>
                <p className="mt-1 text-xs text-muted-foreground">Get help from our team</p>
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg border border-border/60 bg-white p-4 transition-colors hover:bg-muted/50"
              >
                <p className="font-semibold">Dashboard</p>
                <p className="mt-1 text-xs text-muted-foreground">Access your account</p>
              </Link>
              <Link
                href="/"
                className="rounded-lg border border-border/60 bg-white p-4 transition-colors hover:bg-muted/50"
              >
                <p className="font-semibold">Home</p>
                <p className="mt-1 text-xs text-muted-foreground">Start from the beginning</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
