import { Suspense } from "react";

import { AdminDashboardClient } from "@/components/organisms/admin-dashboard-client";
import { AdminDashboardMetrics } from "@/components/organisms/admin-dashboard-metrics";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-3xl bg-gray-200 animate-pulse" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-3xl bg-gray-200 animate-pulse" />
        <div className="h-80 rounded-3xl bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome to the VerifyNIN admin portal. Here&apos;s what&apos;s
          happening today.
        </p>
      </div>

      {/* Key Metrics */}
      <Suspense fallback={<DashboardSkeleton />}>
        <AdminDashboardMetrics />
      </Suspense>

      {/* Dashboard Content */}
      <Suspense fallback={<DashboardSkeleton />}>
        <AdminDashboardClient />
      </Suspense>
    </div>
  );
}
