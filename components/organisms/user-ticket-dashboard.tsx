"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  Eye,
  Star,
  RotateCcw,
  Calendar,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TicketCreationWizard } from "./ticket-creation-wizard";
import { formatRelativeTime } from "@/lib/format";

interface UserTicket {
  id: string;
  category: string;
  status: string;
  priority: string;
  subject: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  assignedAdminName: string | null;
  messageCount: number;
  lastMessage?: string;
  satisfactionRating?: number;
}

interface UserTicketDashboardProps {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

export function UserTicketDashboard({ user }: UserTicketDashboardProps) {
  const router = useRouter();
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/support/tickets");
      if (!response.ok) throw new Error("Failed to fetch tickets");
      
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketCreated = (ticketId: string) => {
    setShowCreateDialog(false);
    fetchTickets();
    router.push(`/dashboard/support/tickets/${ticketId}`);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { className: "bg-blue-100 text-blue-800", label: "Open", icon: MessageSquare },
      assigned: { className: "bg-purple-100 text-purple-800", label: "Assigned", icon: User },
      in_progress: { className: "bg-amber-100 text-amber-800", label: "In Progress", icon: Clock },
      resolved: { className: "bg-emerald-100 text-emerald-800", label: "Resolved", icon: CheckCircle },
      closed: { className: "bg-gray-100 text-gray-800", label: "Closed", icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { className: "bg-gray-100 text-gray-800", label: status, icon: MessageSquare };

    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      urgent: { className: "bg-red-100 text-red-800", label: "Urgent" },
      high: { className: "bg-orange-100 text-orange-800", label: "High" },
      medium: { className: "bg-yellow-100 text-yellow-800", label: "Medium" },
      low: { className: "bg-green-100 text-green-800", label: "Low" }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || 
                  { className: "bg-gray-100 text-gray-800", label: priority };

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const categoryLabels = {
      payment_issue: "Payment Issue",
      verification_problem: "Verification Problem", 
      account_access: "Account Access",
      technical_support: "Technical Support",
      general_inquiry: "General Inquiry"
    };

    return categoryLabels[category as keyof typeof categoryLabels] || category;
  };

  const renderSatisfactionRating = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star}
            className={`h-3 w-3 ${
              star <= rating 
                ? "text-yellow-400 fill-current" 
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Support Tickets</h1>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">My Support Tickets</h1>
          <p className="text-gray-600">Track and manage your support requests</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <TicketCreationWizard
              user={user}
              onComplete={handleTicketCreated}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No support tickets yet</h3>
            <p className="text-gray-600 mb-6">
              When you need help, create a support ticket and we&apos;ll assist you quickly.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {ticket.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">#{ticket.id.slice(-8)}</p>
                        <p className="text-xs text-gray-500">{getCategoryLabel(ticket.category)}</p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Created {formatRelativeTime(ticket.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{ticket.messageCount} messages</span>
                      </div>
                      {ticket.assignedAdminName && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>Assigned to {ticket.assignedAdminName}</span>
                        </div>
                      )}
                    </div>

                    {/* Last Message Preview */}
                    {ticket.lastMessage && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          <span className="font-medium">Latest update:</span> {ticket.lastMessage}
                        </p>
                      </div>
                    )}

                    {/* Resolution & Rating */}
                    {ticket.status === "resolved" && (
                      <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-700">
                            Resolved {formatRelativeTime(ticket.resolvedAt!)}
                          </span>
                        </div>
                        {ticket.satisfactionRating ? (
                          renderSatisfactionRating(ticket.satisfactionRating)
                        ) : (
                          <Button variant="outline" size="sm">
                            <Star className="h-4 w-4 mr-1" />
                            Rate Support
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/support/tickets/${ticket.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    
                    {ticket.status === "resolved" && !ticket.satisfactionRating && (
                      <Button variant="outline" size="sm">
                        <Star className="h-4 w-4 mr-2" />
                        Rate Support
                      </Button>
                    )}
                    
                    {ticket.status === "closed" && (
                      <Button variant="outline" size="sm">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}