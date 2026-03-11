import type { ReactNode } from "react";

export default function AuthLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-orange-50">
      <div className="container flex min-h-screen items-center justify-center py-16">
        {children}
      </div>
    </div>
  );
}
