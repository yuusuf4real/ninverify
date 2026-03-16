"use client";

import { useState, useEffect, useCallback } from "react";
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
  useConfirmationModal,
  confirmationActions,
} from "@/components/ui/confirmation-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserDetailModal } from "@/components/organisms/user-detail-modal";
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

interface UserListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function UserManagementClient() {
  const searchParams = useSearchParams();
  const { showConfirmation, ConfirmationModal } = useConfirmationModal();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort") || "created_at",
  );
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("order") || "desc",
  );

  // Modal state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status,
        sort: sortBy,
        order: sortOrder,
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");

      const data: UserListResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, status, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? "↑" : "↓";
  };

  const handleUserAction = async (
    userId: string,
    action: "suspend" | "activate",
  ) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const confirmationAction =
      action === "suspend"
        ? confirmationActions.suspendUser(user.fullName)
        : {
            type: "success" as const,
            title: "Activate User Account",
            description: `Are you sure you want to activate ${user.fullName}'s account? They will regain access to all features.`,
            confirmText: "Activate User",
            cancelText: "Cancel",
          };

    showConfirmation(confirmationAction, async () => {
      try {
        const response = await fetch(
          `/api/admin/users/${userId}?action=${action}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reason:
                action === "suspend" ? "Administrative action" : undefined,
            }),
          },
        );

        if (!response.ok) throw new Error(`Failed to ${action} user`);

        // Refresh users list
        fetchUsers();
      } catch (error) {
        console.error(`Error ${action}ing user:`, error);
      }
    });
  };

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserModal(true);
  };

  const getStatusBadge = (isSuspended: boolean) => {
    if (isSuspended) {
      return <Badge variant="warning">Suspended</Badge>;
    }
    return <Badge variant="success">Active</Badge>;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
                <div className="relative flex-1 min-w-[220px] sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Total Users</p>
                  <p className="text-2xl font-bold">
                    {pagination.total.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">Active Users</p>
                  <p className="text-2xl font-bold">
                    {users.filter((u) => !u.isSuspended).length}
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
                    {users.filter((u) => u.isSuspended).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Balance</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      users.reduce((sum, u) => sum + (u.balance || 0), 0),
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({pagination.total.toLocaleString()})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-100 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSortChange("fullName")}
                      >
                        Name {getSortIcon("fullName")}
                      </TableHead>
                      <TableHead
                        className="hidden lg:table-cell cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSortChange("email")}
                      >
                        Email {getSortIcon("email")}
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead
                        className="hidden md:table-cell cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSortChange("balance")}
                      >
                        Balance {getSortIcon("balance")}
                      </TableHead>
                      <TableHead
                        className="hidden xl:table-cell cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSortChange("created_at")}
                      >
                        Joined {getSortIcon("created_at")}
                      </TableHead>
                      <TableHead className="hidden xl:table-cell">
                        Last Active
                      </TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{user.fullName}</p>
                            <p className="text-sm text-gray-500">
                              {user.phone}
                            </p>
                            <div className="space-y-1 text-xs text-gray-500 lg:hidden">
                              <p className="truncate">{user.email}</p>
                              <p>
                                Balance: {formatCurrency(user.balance || 0)}
                              </p>
                              <p>
                                Last active:{" "}
                                {user.lastLoginAt
                                  ? formatDate(user.lastLoginAt)
                                  : "Never"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user.isSuspended)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatCurrency(user.balance || 0)}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {user.lastLoginAt
                            ? formatDate(user.lastLoginAt)
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewUser(user.id)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {user.isSuspended ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUserAction(user.id, "activate")
                                  }
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Activate User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUserAction(user.id, "suspend")
                                  }
                                  className="text-red-600"
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Suspend User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )}{" "}
                    of {pagination.total} users
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }))
                      }
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page + 1,
                        }))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          open={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUserId(null);
          }}
          onUserUpdated={fetchUsers}
        />
      )}

      {/* Confirmation Modal */}
      {ConfirmationModal}
    </>
  );
}
