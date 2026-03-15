"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Clock,
  Settings,
  Send,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRelativeTime } from "@/lib/format";

interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: string;
  message: string;
  messageType: string;
  isInternal: boolean;
  isSystemGenerated: boolean;
  attachments: unknown;
  readAt: string | null;
  metadata: unknown;
  createdAt: string;
  senderName: string;
  senderEmail: string;
}

interface AssignedAdmin {
  id: string;
  fullName: string;
  email: string;
}

interface TicketDetail {
  id: string;
  userId: string;
  category: string;
  subcategory: string | null;
  status: string;
  priority: string;
  subject: string;
  description: string;
  transactionId: string | null;
  verificationId: string | null;
  paymentReference: string | null;
  assignedTo: string | null;
  department: string;
  slaTier: string;
  firstResponseDue: string | null;
  resolutionDue: string | null;
  firstResponseAt: string | null;
  satisfactionRating: number | null;
  satisfactionFeedback: string | null;
  sourceChannel: string;
  userAgent: string | null;
  ipAddress: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  userEmail: string;
  userFullName: string;
  userPhone: string;
  assignedAdmin: AssignedAdmin | null;
}

interface TicketDetailResponse {
  ticket: TicketDetail;
  messages: TicketMessage[];
}

interface AdminTicketDetailClientProps {
  ticketId: string;
}

export function AdminTicketDetailClient({
  ticketId,
}: AdminTicketDetailClientProps) {
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [sending, setSending] = useState(false);

  // Form states
  const [newMessage, setNewMessage] = useState("");
  const [isInternalMessage, setIsInternalMessage] = useState(false);
  const [showInternalMessages, setShowInternalMessages] = useState(true);

  // Update states
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const fetchTicketDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`);
      if (!response.ok) throw new Error("Failed to fetch ticket details");

      const data: TicketDetailResponse = await response.json();
      setTicket(data.ticket);
      setMessages(data.messages);
    } catch (error) {
      console.error("Error fetching ticket details:", error);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicketDetails();
  }, [fetchTicketDetails]);

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
      setPriority(ticket.priority);
    }
  }, [ticket]);

  const handleUpdateTicket = async () => {
    if (!ticket) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          priority,
        }),
      });

      if (!response.ok) throw new Error("Failed to update ticket");

      await fetchTicketDetails();
    } catch (error) {
      console.error("Error updating ticket:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newMessage,
          isInternal: isInternalMessage,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      setNewMessage("");
      setIsInternalMessage(false);
      await fetchTicketDetails();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
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

  const filteredMessages = showInternalMessages
    ? messages
    : messages.filter((msg) => !msg.isInternal);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-96 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ticket not found</p>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/support")}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Support Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/support")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{ticket.subject}</h1>
            <p className="text-gray-600">
              Ticket #{ticket.id.slice(0, 8)} •{" "}
              {getCategoryLabel(ticket.category)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(ticket.status)}
          {getPriorityBadge(ticket.priority)}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>

              {ticket.paymentReference && (
                <div>
                  <h3 className="font-semibold mb-2">Payment Reference</h3>
                  <p className="font-mono bg-gray-100 px-3 py-2 rounded">
                    {ticket.paymentReference}
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">Created</h3>
                  <p className="text-gray-600">
                    {formatRelativeTime(ticket.createdAt)}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Last Updated</h3>
                  <p className="text-gray-600">
                    {formatRelativeTime(ticket.updatedAt)}
                  </p>
                </div>
                {ticket.resolvedAt && (
                  <div>
                    <h3 className="font-semibold mb-2">Resolved</h3>
                    <p className="text-gray-600">
                      {formatRelativeTime(ticket.resolvedAt)}
                    </p>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold mb-2">Source</h3>
                  <p className="text-gray-600 capitalize">
                    {ticket.sourceChannel}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Conversation ({filteredMessages.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setShowInternalMessages(!showInternalMessages)
                    }
                  >
                    {showInternalMessages ? (
                      <EyeOff className="h-4 w-4 mr-2" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    {showInternalMessages ? "Hide Internal" : "Show Internal"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${
                      message.senderType === "agent"
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : "bg-gray-50 border-l-4 border-gray-300"
                    } ${message.isInternal ? "bg-yellow-50 border-yellow-500" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {message.senderName}
                        </span>
                        <Badge
                          className={
                            message.senderType === "agent"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {message.senderType === "agent" ? "Admin" : "User"}
                        </Badge>
                        {message.isInternal && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Internal
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatRelativeTime(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {message.message}
                    </p>
                  </div>
                ))}
              </div>

              {/* Add Message Form */}
              <div className="mt-6 pt-6 border-t">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Type your response..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={4}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="internal"
                        checked={isInternalMessage}
                        onChange={(e) => setIsInternalMessage(e.target.checked)}
                      />
                      <label
                        htmlFor="internal"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Internal note (not visible to user)
                      </label>
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {sending ? "Sending..." : "Send Response"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold">{ticket.userFullName}</p>
                <p className="text-sm text-gray-600">{ticket.userEmail}</p>
                <p className="text-sm text-gray-600">{ticket.userPhone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Management */}
          <Card className="border-emerald-100/80 bg-white shadow-lg">
            <CardHeader className="border-b border-emerald-100/70 pb-4">
              <CardTitle className="flex items-center gap-2 text-base text-emerald-900">
                <Settings className="h-5 w-5 text-emerald-700" />
                Ticket Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Status
                </label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-2 h-11 bg-white shadow-sm border-slate-200/80 focus:border-emerald-400 focus:ring-emerald-300/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Priority
                </label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="mt-2 h-11 bg-white shadow-sm border-slate-200/80 focus:border-emerald-400 focus:ring-emerald-300/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleUpdateTicket}
                disabled={updating}
                className="w-full rounded-2xl shadow-sm"
              >
                {updating ? "Updating..." : "Update Ticket"}
              </Button>
            </CardContent>
          </Card>

          {/* Assignment Info */}
          {ticket.assignedAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Assigned To
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="font-semibold">
                    {ticket.assignedAdmin.fullName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {ticket.assignedAdmin.email}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SLA Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                SLA Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Tier</p>
                <p className="text-sm text-gray-600 capitalize">
                  {ticket.slaTier}
                </p>
              </div>
              {ticket.firstResponseDue && (
                <div>
                  <p className="text-sm font-medium">First Response Due</p>
                  <p className="text-sm text-gray-600">
                    {formatRelativeTime(ticket.firstResponseDue)}
                  </p>
                </div>
              )}
              {ticket.resolutionDue && (
                <div>
                  <p className="text-sm font-medium">Resolution Due</p>
                  <p className="text-sm text-gray-600">
                    {formatRelativeTime(ticket.resolutionDue)}
                  </p>
                </div>
              )}
              {ticket.firstResponseAt && (
                <div>
                  <p className="text-sm font-medium">First Response</p>
                  <p className="text-sm text-gray-600">
                    {formatRelativeTime(ticket.firstResponseAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
