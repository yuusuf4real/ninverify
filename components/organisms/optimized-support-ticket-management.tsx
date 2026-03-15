"use client";

import React, { memo, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Download,
  Eye,
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Calendar,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useMutation, useApi } from "@/lib/hooks/use-api";
import { useDebounce } from "@/lib/hooks/use-performance";
import { useAppStore } from "@/lib/stores/app-store";
import { formatRelativeTime } from "@/lib/format";

interface SupportTicket {
  id: string;
  userId: string;
  category: string;
  status: string;
  priority: string;
  subject: string;
  description: string;
  paymentReference: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  userEmail: string;
  userFullName: string;
  assignedAdminEmail: string | null;
  assignedAdminName: string | null;
  messageCount: number;
}

interface TicketSummary {
  openCount: number;
  assignedCount: number;
  inProgressCount: number;
  resolvedCount: number;
  urgentCount: number;
  highCount: number;
}

// Memoized summary cards component
const SummaryCards = memo(({ summary }: { summary: TicketSummary | null }) => {
  const cards = useMemo(() => {
    if (!summary) return [];

    return [
      {
        icon: MessageSquare,
        label: "Open Tickets",
        value: summary.openCount,
        color: "text-blue-500",
      },
      {
        icon: Clock,
        label: "In Progress",
        value: summary.inProgressCount,
        color: "text-amber-500",
      },
      {
        icon: AlertTriangle,
        label: "Urgent",
        value: summary.urgentCount,
        color: "text-red-500",
      },
      {
        icon: CheckCircle,
        label: "Resolved",
        value: summary.resolvedCount,
        color: "text-emerald-500",
      },
    ];
  }, [summary]);

  if (!summary) return null;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map(({ icon: Icon, label, value, color }) => (
        <Card key={label}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

SummaryCards.displayName = "SummaryCards";

// Memoized ticket item component
const TicketItem = memo(
  ({
    ticket,
    onViewDetails,
    onAssignToMe,
    onMarkResolved,
  }: {
    ticket: SupportTicket;
    onViewDetails: (id: string) => void;
    onAssignToMe: (id: string) => void;
    onMarkResolved: (id: string) => void;
  }) => {
    const statusConfig = useMemo(
      () => ({
        open: { className: "bg-blue-100 text-blue-800", label: "Open" },
        assigned: {
          className: "bg-purple-100 text-purple-800",
          label: "Assigned",
        },
        in_progress: {
          className: "bg-amber-100 text-amber-800",
          label: "In Progress",
        },
        resolved: {
          className: "bg-emerald-100 text-emerald-800",
          label: "Resolved",
        },
        closed: { className: "bg-gray-100 text-gray-800", label: "Closed" },
      }),
      [],
    );

    const priorityConfig = useMemo(
      () => ({
        urgent: { className: "bg-red-100 text-red-800", label: "Urgent" },
        high: { className: "bg-orange-100 text-orange-800", label: "High" },
        medium: { className: "bg-yellow-100 text-yellow-800", label: "Medium" },
        low: { className: "bg-green-100 text-green-800", label: "Low" },
      }),
      [],
    );

    const categoryLabels = useMemo(
      () => ({
        payment_issue: "Payment Issue",
        verification_problem: "Verification Problem",
        account_access: "Account Access",
        technical_support: "Technical Support",
        general_inquiry: "General Inquiry",
      }),
      [],
    );

    const statusBadge = statusConfig[
      ticket.status as keyof typeof statusConfig
    ] || { className: "bg-gray-100 text-gray-800", label: ticket.status };

    const priorityBadge = priorityConfig[
      ticket.priority as keyof typeof priorityConfig
    ] || { className: "bg-gray-100 text-gray-800", label: ticket.priority };

    const categoryLabel =
      categoryLabels[ticket.category as keyof typeof categoryLabels] ||
      ticket.category;

    const handleViewDetails = useCallback(
      () => onViewDetails(ticket.id),
      [onViewDetails, ticket.id],
    );
    const handleAssignToMe = useCallback(
      () => onAssignToMe(ticket.id),
      [onAssignToMe, ticket.id],
    );
    const handleMarkResolved = useCallback(
      () => onMarkResolved(ticket.id),
      [onMarkResolved, ticket.id],
    );

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                    <Badge className={statusBadge.className}>
                      {statusBadge.label}
                    </Badge>
                    <Badge className={priorityBadge.className}>
                      {priorityBadge.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {ticket.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    #{ticket.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-500">{categoryLabel}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{ticket.userFullName}</span>
                  <span className="text-gray-400">({ticket.userEmail})</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{ticket.messageCount} messages</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatRelativeTime(ticket.createdAt)}</span>
                </div>
                {ticket.assignedAdminName && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Assigned to {ticket.assignedAdminName}</span>
                  </div>
                )}
              </div>

              {ticket.paymentReference && (
                <div className="text-sm">
                  <span className="text-gray-500">Payment Ref:</span>
                  <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                    {ticket.paymentReference}
                  </span>
                </div>
              )}
            </div>

            <div className="ml-4">
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
                  <DropdownMenuItem onClick={handleAssignToMe}>
                    <User className="h-4 w-4 mr-2" />
                    Assign to Me
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleViewDetails}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Response
                  </DropdownMenuItem>
                  {ticket.status !== "resolved" && (
                    <DropdownMenuItem onClick={handleMarkResolved}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Resolved
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
);

TicketItem.displayName = "TicketItem";

interface TicketListResponse {
  tickets: SupportTicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: TicketSummary;
}

export const OptimizedSupportTicketManagement = memo(() => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addNotification } = useAppStore();

  // Filter states
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";
  const priority = searchParams.get("priority") || "all";
  const category = searchParams.get("category") || "all";
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Build filters object
  const filters = useMemo(
    () => ({
      ...(search && { search }),
      status,
      priority,
      category,
    }),
    [search, status, priority, category],
  );

  // Fetch tickets with caching
  const {
    data: ticketData,
    loading,
    error,
    refetch,
  } = useApi<TicketListResponse>(
    `/api/admin/support/tickets?${new URLSearchParams({
      page: page.toString(),
      limit: "50",
      ...filters,
    }).toString()}`,
    {
      cacheKey: "admin-tickets",
      cacheTime: 2 * 60 * 1000, // 2 minutes
    },
  );

  // Mutations for ticket actions
  const assignMutation = useMutation(
    async (ticketId: string) => {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignToMe: true }),
      });
      if (!response.ok) throw new Error("Failed to assign ticket");
      return response.json();
    },
    {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Ticket Assigned",
          message: "Ticket has been assigned to you successfully",
        });
        refetch();
      },
      onError: () => {
        addNotification({
          type: "error",
          title: "Assignment Failed",
          message: "Failed to assign ticket. Please try again.",
        });
      },
    },
  );

  const resolveMutation = useMutation(
    async (ticketId: string) => {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      if (!response.ok) throw new Error("Failed to resolve ticket");
      return response.json();
    },
    {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Ticket Resolved",
          message: "Ticket has been marked as resolved",
        });
        refetch();
      },
      onError: () => {
        addNotification({
          type: "error",
          title: "Resolution Failed",
          message: "Failed to resolve ticket. Please try again.",
        });
      },
    },
  );

  // Debounced search handler
  const debouncedSearch = useDebounce<(value: string) => void>(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`?${params.toString()}`);
    },
    300,
  );

  // Event handlers
  const handleViewDetails = useCallback(
    (ticketId: string) => {
      router.push(`/admin/support/${ticketId}`);
    },
    [router],
  );

  const handleAssignToMe = useCallback(
    (ticketId: string) => {
      assignMutation.mutate(ticketId);
    },
    [assignMutation],
  );

  const handleMarkResolved = useCallback(
    (ticketId: string) => {
      resolveMutation.mutate(ticketId);
    },
    [resolveMutation],
  );

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Filter change handlers
  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.set("page", "1");
      router.push(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("page", newPage.toString());
      router.push(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Failed to load tickets</p>
        <Button onClick={handleRefresh}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <SummaryCards summary={ticketData?.summary || null} />

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search tickets, users, or subjects..."
                  defaultValue={search}
                  onChange={(e) => debouncedSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={priority}
                onValueChange={(value) => handleFilterChange("priority", value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={category}
                onValueChange={(value) => handleFilterChange("category", value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="payment_issue">Payment Issue</SelectItem>
                  <SelectItem value="verification_problem">
                    Verification Problem
                  </SelectItem>
                  <SelectItem value="account_access">Account Access</SelectItem>
                  <SelectItem value="technical_support">
                    Technical Support
                  </SelectItem>
                  <SelectItem value="general_inquiry">
                    General Inquiry
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "opacity-50" : ""}`}
                />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Support Tickets (
            {ticketData?.pagination.total.toLocaleString() || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={8} />
          ) : (
            <div className="space-y-4">
              {ticketData?.tickets.map((ticket: SupportTicket) => (
                <TicketItem
                  key={ticket.id}
                  ticket={ticket}
                  onViewDetails={handleViewDetails}
                  onAssignToMe={handleAssignToMe}
                  onMarkResolved={handleMarkResolved}
                />
              ))}

              {/* Pagination */}
              {ticketData && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-600">
                    Showing{" "}
                    {(ticketData.pagination.page - 1) *
                      ticketData.pagination.limit +
                      1}{" "}
                    to{" "}
                    {Math.min(
                      ticketData.pagination.page * ticketData.pagination.limit,
                      ticketData.pagination.total,
                    )}{" "}
                    of {ticketData.pagination.total} tickets
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={ticketData.pagination.page <= 1}
                      onClick={() =>
                        handlePageChange(ticketData.pagination.page - 1)
                      }
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        ticketData.pagination.page >=
                        ticketData.pagination.totalPages
                      }
                      onClick={() =>
                        handlePageChange(ticketData.pagination.page + 1)
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

OptimizedSupportTicketManagement.displayName =
  "OptimizedSupportTicketManagement";
