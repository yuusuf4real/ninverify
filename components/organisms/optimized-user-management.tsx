"use client";

import React, { memo, useMemo, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  UserX,
  UserCheck,
  DollarSign,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { OptimizedList } from "@/components/ui/optimized-list";
import { UserDetailModal } from "@/components/organisms/user-detail-modal";
import { usePaginatedApi, useMutation } from "@/lib/hooks/use-api";
import { useDebounce } from "@/lib/hooks/use-performance";
import { useAppStore } from "@/lib/stores/app-store";
import { formatCurrency, formatDate } from "@/lib/format";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  isSuspended: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  balance: number;
}

// Memoized user row component
const UserRow = memo(
  ({
    user,
    onViewDetails,
    onToggleSuspension,
  }: {
    user: User;
    onViewDetails: (id: string) => void;
    onToggleSuspension: (id: string, suspend: boolean) => void;
  }) => {
    const handleViewDetails = useCallback(
      () => onViewDetails(user.id),
      [onViewDetails, user.id],
    );
    const handleToggleSuspension = useCallback(() => {
      onToggleSuspension(user.id, !user.isSuspended);
    }, [onToggleSuspension, user.id, user.isSuspended]);

    return (
      <TableRow className="hover:bg-gray-50">
        <TableCell>
          <div>
            <div className="font-medium">{user.fullName}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </TableCell>
        <TableCell>{user.phone}</TableCell>
        <TableCell>
          <Badge
            className={
              user.isSuspended
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }
          >
            {user.isSuspended ? "Suspended" : "Active"}
          </Badge>
        </TableCell>
        <TableCell>{formatCurrency(user.balance)}</TableCell>
        <TableCell>{formatDate(user.createdAt)}</TableCell>
        <TableCell>
          {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleViewDetails}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleSuspension}>
                {user.isSuspended ? (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Activate User
                  </>
                ) : (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    Suspend User
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  },
);

UserRow.displayName = "UserRow";

// Memoized user card for mobile view
const UserCard = memo(
  ({
    user,
    onViewDetails,
    onToggleSuspension,
  }: {
    user: User;
    onViewDetails: (id: string) => void;
    onToggleSuspension: (id: string, suspend: boolean) => void;
  }) => {
    const handleViewDetails = useCallback(
      () => onViewDetails(user.id),
      [onViewDetails, user.id],
    );
    const handleToggleSuspension = useCallback(() => {
      onToggleSuspension(user.id, !user.isSuspended);
    }, [onToggleSuspension, user.id, user.isSuspended]);

    return (
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-medium">{user.fullName}</div>
            <div className="text-sm text-gray-500 mb-2">{user.email}</div>
            <div className="flex items-center gap-4 text-sm">
              <span>{user.phone}</span>
              <Badge
                className={
                  user.isSuspended
                    ? "bg-red-100 text-red-800"
                    : "bg-green-100 text-green-800"
                }
              >
                {user.isSuspended ? "Suspended" : "Active"}
              </Badge>
              <span className="font-medium">
                {formatCurrency(user.balance)}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleViewDetails}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleSuspension}>
                {user.isSuspended ? (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Activate User
                  </>
                ) : (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    Suspend User
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    );
  },
);

UserCard.displayName = "UserCard";

export const OptimizedUserManagement = memo(() => {
  const searchParams = useSearchParams();
  const { addNotification } = useAppStore();

  // State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Filter states from URL
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";
  const sortBy = searchParams.get("sort") || "created_at";
  const sortOrder = searchParams.get("order") || "desc";
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Build filters object
  const filters = useMemo(
    () => ({
      ...(search && { search }),
      status,
      sort: sortBy,
      order: sortOrder,
    }),
    [search, status, sortBy, sortOrder],
  );

  // Fetch users with caching
  const {
    data: userData,
    loading,
    error,
    refetch,
  } = usePaginatedApi<User>("/api/admin/users", {
    page,
    limit: 50,
    filters,
    cacheKey: "admin-users",
    cacheTime: 3 * 60 * 1000, // 3 minutes
  });

  // Mutation for user suspension
  const suspensionMutation = useMutation(
    async ({ userId, suspend }: { userId: string; suspend: boolean }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuspended: suspend }),
      });
      if (!response.ok) throw new Error("Failed to update user status");
      return response.json();
    },
    {
      onSuccess: (_, { suspend }) => {
        addNotification({
          type: "success",
          title: suspend ? "User Suspended" : "User Activated",
          message: `User has been ${suspend ? "suspended" : "activated"} successfully`,
        });
        refetch();
      },
      onError: () => {
        addNotification({
          type: "error",
          title: "Update Failed",
          message: "Failed to update user status. Please try again.",
        });
      },
    },
  );

  // Debounced search
  const debouncedSearch = useDebounce<(value: string) => void>(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      window.history.pushState({}, "", `?${params.toString()}`);
    },
    300,
  );

  // Event handlers
  const handleViewDetails = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setShowUserModal(true);
  }, []);

  const handleToggleSuspension = useCallback(
    (userId: string, suspend: boolean) => {
      suspensionMutation.mutate({ userId, suspend });
    },
    [suspensionMutation],
  );

  const handleCloseModal = useCallback(() => {
    setShowUserModal(false);
    setSelectedUserId(null);
  }, []);

  const handleUserUpdated = useCallback(() => {
    refetch();
  }, [refetch]);

  // Render user item for virtual list
  const renderUserItem = useCallback(
    (user: User) => (
      <UserCard
        key={user.id}
        user={user}
        onViewDetails={handleViewDetails}
        onToggleSuspension={handleToggleSuspension}
      />
    ),
    [handleViewDetails, handleToggleSuspension],
  );

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Failed to load users</p>
        <Button onClick={refetch}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold">
                  {userData?.pagination.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Active Users</p>
                <p className="text-2xl font-bold">
                  {userData?.data.filter((u) => !u.isSuspended).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Suspended</p>
                <p className="text-2xl font-bold">
                  {userData?.data.filter((u) => u.isSuspended).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <div>
                <p className="text-sm font-medium">Total Balance</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    userData?.data.reduce(
                      (sum, user) => sum + user.balance,
                      0,
                    ) || 0,
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search users by name, email, or phone..."
                  defaultValue={search}
                  onChange={(e) => debouncedSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={status}
                onValueChange={(value) => {
                  const params = new URLSearchParams(searchParams);
                  if (value === "all") {
                    params.delete("status");
                  } else {
                    params.set("status", value);
                  }
                  params.set("page", "1");
                  window.history.pushState({}, "", `?${params.toString()}`);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setViewMode(viewMode === "table" ? "cards" : "table")
                }
              >
                <Filter className="h-4 w-4 mr-2" />
                {viewMode === "table" ? "Card View" : "Table View"}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Users ({userData?.pagination.total.toLocaleString() || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={10} />
          ) : viewMode === "table" ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userData?.data.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onViewDetails={handleViewDetails}
                      onToggleSuspension={handleToggleSuspension}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <OptimizedList
              items={userData?.data || []}
              renderItem={renderUserItem}
              itemHeight={120}
              containerHeight={600}
              keyExtractor={(user) => user.id}
              className="space-y-4"
            />
          )}

          {/* Pagination */}
          {userData && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-600">
                Showing{" "}
                {(userData.pagination.page - 1) * userData.pagination.limit + 1}{" "}
                to{" "}
                {Math.min(
                  userData.pagination.page * userData.pagination.limit,
                  userData.pagination.total,
                )}{" "}
                of {userData.pagination.total} users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={userData.pagination.page <= 1}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set(
                      "page",
                      (userData.pagination.page - 1).toString(),
                    );
                    window.history.pushState({}, "", `?${params.toString()}`);
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    userData.pagination.page >= userData.pagination.totalPages
                  }
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set(
                      "page",
                      (userData.pagination.page + 1).toString(),
                    );
                    window.history.pushState({}, "", `?${params.toString()}`);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          open={showUserModal}
          onClose={handleCloseModal}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
});

OptimizedUserManagement.displayName = "OptimizedUserManagement";
