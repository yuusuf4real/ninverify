import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  History,
  RefreshCw,
  UserCircle,
  Wallet,
  MessageSquare,
} from "lucide-react";

import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/components/organisms/logout-button";
import { ActiveNavigation, MobileNavigation } from "@/components/ui/active-navigation";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const displayName = session.fullName || session.email;

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: Wallet },
    { name: "History", href: "/dashboard/transactions", icon: History },
    { name: "Recovery", href: "/dashboard/recovery", icon: RefreshCw },
    { name: "Support", href: "/dashboard/support", icon: MessageSquare },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 print:hidden">
        <div className="absolute -left-24 top-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-28 top-10 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-border/70 bg-white/80 backdrop-blur print:hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-2xl bg-white shadow-glow">
                <Image
                  src="/images/logo-mark.svg"
                  alt="VerifyNIN logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="space-y-1">
                <Image
                  src="/images/logo-wordmark.svg"
                  alt="VerifyNIN wordmark"
                  width={140}
                  height={36}
                  className="h-6 w-auto"
                />
                <p className="text-sm text-muted-foreground">Dashboard</p>
              </div>
            </Link>

            <div className="hidden md:block">
              <ActiveNavigation items={navigationItems} variant="horizontal" />
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-3 rounded-full border border-border/70 bg-white/90 px-4 py-2 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserCircle className="h-5 w-5" />
                </div>
                <div className="text-sm leading-tight">
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="font-medium">{displayName}</p>
                </div>
              </div>

              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <div className="md:hidden">
        <MobileNavigation items={navigationItems} />
      </div>

      <main className="relative z-10 container mx-auto px-4 pb-12 pt-8 max-w-6xl print:p-0 print:max-w-none">
        <div className="mb-6 flex items-center gap-3 lg:hidden print:hidden">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-border/70 bg-white/90 px-4 py-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="font-medium">{displayName}</p>
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
