"use client";

import { useState, useEffect, useCallback } from "react";
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

export function SupportTicketManagementClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showConfirmation, ConfirmationModal } = useConfirmationModal();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [priority, setPriority] = useState(
    searchParams.get("priority") || "all",
  );
  const [category, setCategory] = useState(
    searchParams.get("category") || "all",
  );
  const [sortBy] = useState(searchParams.get("sort") || "created_at");
  const [sortOrder] = useState(searchParams.get("order") || "desc");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status,
        priority,
        category,
        sort: sortBy,
        order: sortOrder,
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/support/tickets?${params}`);
      if (!response.ok) throw new Error("Failed to fetch tickets");

      const data: TicketListResponse = await response.json();
      setTickets(data.tickets);
      setPagination(data.pagination);
      setSummary(data.summary);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    search,
    status,
    priority,
    category,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  };

  const handleViewDetails = (ticketId: string) => {
    router.push(`/admin/support/${ticketId}`);
  };

  const handleAssignToMe = async (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    showConfirmation(
      {
        type: "info",
        title: "Assign Ticket to Yourself",
        description: `Are you sure you want to assign ticket #${ticket.id} to yourself? You will become responsible for resolving this ticket.`,
        confirmText: "Assign to Me",
        cancelText: "Cancel",
      },
      async () => {
        try {
          const response = await fetch(
            `/api/admin/support/tickets/${ticketId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                assignToMe: true,
              }),
            },
          );

          if (!response.ok) throw new Error("Failed to assign ticket");

          await fetchTickets();
        } catch (error) {
          console.error("Error assigning ticket:", error);
        }
      },
    );
  };

  const handleMarkResolved = async (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    showConfirmation(confirmationActions.resolveTicket(ticket.id), async () => {
      try {
        const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "resolved",
          }),
        });

        if (!response.ok) throw new Error("Failed to resolve ticket");

        await fetchTickets();
      } catch (error) {
        console.error("Error resolving ticket:", error);
      }
    });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePriorityChange = (value: string) => {
    setPriority(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
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
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      className: "bg-gray-100 text-gray-800",
      label: status,
    };

    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      urgent: { className: "bg-red-100 text-red-800", label: "Urgent" },
      high: { className: "bg-orange-100 text-orange-800", label: "High" },
      medium: { className: "bg-yellow-100 text-yellow-800", label: "Medium" },
      low: { className: "bg-green-100 text-green-800", label: "Low" },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || {
      className: "bg-gray-100 text-gray-800",
      label: priority,
    };

    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    const categoryLabels = {
      payment_issue: "Payment Issue",
      verification_problem: "Verification Problem",
      account_access: "Account Access",
      technical_support: "Technical Support",
      general_inquiry: "General Inquiry",
    };

    return categoryLabels[category as keyof typeof categoryLabels] || category;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Open Tickets</p>
                  <p className="text-2xl font-bold">{summary.openCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">In Progress</p>
                  <p className="text-2xl font-bold">
                    {summary.inProgressCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Urgent</p>
                  <p className="text-2xl font-bold">{summary.urgentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">Resolved</p>
                  <p className="text-2xl font-bold">{summary.resolvedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:flex-wrap">
              <div className="relative flex-1 min-w-[220px] lg:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search tickets, users, or subjects..."
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
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priority} onValueChange={handlePriorityChange}>
                <SelectTrigger className="w-full sm:w-32">
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
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full sm:w-48">
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
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? "opacity-50" : ""}`}
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
            Support Tickets ({pagination.total.toLocaleString()})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-lg">
                                {ticket.subject}
                              </h3>
                              {getStatusBadge(ticket.status)}
                              {getPriorityBadge(ticket.priority)}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {ticket.description}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-sm font-medium">
                              #{ticket.id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getCategoryLabel(ticket.category)}
                            </p>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:items-center">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{ticket.userFullName}</span>
                            <span className="text-gray-400">
                              ({ticket.userEmail})
                            </span>
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
                              <span>
                                Assigned to {ticket.assignedAdminName}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Payment Reference */}
                        {ticket.paymentReference && (
                          <div className="text-sm">
                            <span className="text-gray-500">Payment Ref:</span>
                            <span className="ml-2 inline-block max-w-full break-all rounded bg-gray-100 px-2 py-1 font-mono">
                              {ticket.paymentReference}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="lg:ml-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(ticket.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAssignToMe(ticket.id)}
                            >
                              <User className="h-4 w-4 mr-2" />
                              Assign to Me
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(ticket.id)}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Add Response
                            </DropdownMenuItem>
                            {ticket.status !== "resolved" && (
                              <DropdownMenuItem
                                onClick={() => handleMarkResolved(ticket.id)}
                              >
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
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-gray-600">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{" "}
                  of {pagination.total} tickets
                </p>
                <div className="flex gap-2">
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

      {/* Confirmation Modal */}
      {ConfirmationModal}
    </div>
  );
}
