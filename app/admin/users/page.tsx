import { Suspense } from "react";
import { UserManagementClient } from "@/components/organisms/user-management-client";

function UserManagementSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
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

export default function UserManagementPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">
          Manage user accounts, view details, and perform administrative
          actions.
        </p>
      </div>

      {/* User Management Interface */}
      <Suspense fallback={<UserManagementSkeleton />}>
        <UserManagementClient />
      </Suspense>
    </div>
  );
}
