import { Suspense } from "react";
import { SystemManagementClient } from "@/components/organisms/system-management-client";

function SystemSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 bg-gray-200 rounded animate-pulse" />
        <div className="h-80 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function SystemManagementPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">System Management</h1>
        <p className="text-gray-600">
          Monitor system health, manage configurations, and view audit logs.
        </p>
      </div>

      {/* System Management Interface */}
      <Suspense fallback={<SystemSkeleton />}>
        <SystemManagementClient />
      </Suspense>
    </div>
  );
}
