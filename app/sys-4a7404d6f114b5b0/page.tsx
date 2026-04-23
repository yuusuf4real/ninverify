import Link from "next/link";
import Image from "next/image";
import { Shield, ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/organisms/admin-login-form";
import { getSession } from "@/lib/auth";

export default async function AdminLoginPage() {
  const session = await getSession();

  if (session) {
    if (session.role === "admin" || session.role === "super_admin") {
      redirect("/admin");
    }
    redirect("/");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-32 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -right-28 top-10 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 shadow-lg">
              <Shield className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Portal</h1>
            <p className="mt-2 text-sm text-slate-600">
              Sign in to access the admin dashboard
            </p>
          </div>

          {/* Login Form */}
          <div className="rounded-3xl border border-slate-200/60 bg-white/90 p-8 shadow-xl backdrop-blur-sm">
            <AdminLoginForm />
          </div>

          {/* Back to Main Site */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to main site
            </Link>
          </div>

          {/* Branding */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Image
                src="/images/logo-mark.svg"
                alt="VerifyNIN"
                width={24}
                height={24}
                className="h-6 w-6"
              />
              <span className="text-sm font-medium text-slate-600">
                VerifyNIN Admin
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
