import { Suspense } from "react";
import { AnalyticsClient } from "@/components/organisms/analytics-client";

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 bg-gray-200 rounded animate-pulse" />
        <div className="h-80 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-600">
          Comprehensive analytics and insights for your NIN verification platform.
        </p>
      </div>

      {/* Analytics Interface */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsClient />
      </Suspense>
    </div>
  );
}