import { ShieldCheck, Sparkles } from "lucide-react";

import { DashboardClient } from "@/components/organisms/dashboard-client";
import { getSession } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getSession();
  const displayName = session?.fullName?.split(" ")[0] || session?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/70 bg-white/90 p-6 shadow-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">
              Dashboard
            </p>
            <h1 className="font-heading text-3xl md:text-4xl">
              Welcome back, {displayName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Fund your wallet and verify NINs for any purpose.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Secure verification
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm font-medium text-muted-foreground">
              <Sparkles className="h-4 w-4 text-secondary" />
              Instant verification documents
            </div>
          </div>
        </div>
      </section>

      <DashboardClient />
    </div>
  );
}
