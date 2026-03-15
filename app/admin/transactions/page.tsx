import { Suspense } from "react";
import { TransactionManagementClient } from "@/components/organisms/transaction-management-client";

function TransactionManagementSkeleton() {
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
      <div className="flex gap-4">
        <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="space-y-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function TransactionManagementPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Transaction Management
        </h1>
        <p className="text-gray-600">
          Monitor and manage all financial transactions, reconcile payments, and
          handle refunds.
        </p>
      </div>

      {/* Transaction Management Interface */}
      <Suspense fallback={<TransactionManagementSkeleton />}>
        <TransactionManagementClient />
      </Suspense>
    </div>
  );
}
