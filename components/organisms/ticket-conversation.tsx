"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Paperclip, 
  User, 
  Bot, 
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Star,
  RotateCcw,
  Phone,
  Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/format";

interface TicketMessage {
  id: string;
  senderId: string;
  senderType: "user" | "agent" | "system";
  senderName?: string;
  message: string;
  messageType: "text" | "image" | "file" | "system_note";
  isInternal: boolean;
  attachments?: Array<{ name: string; url: string; type: string; }>;
  createdAt: string;
  readAt?: string;
}

interface TicketDetails {
  id: string;
  category: string;
  status: string;
  priority: string;
  subject: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignedAdminName?: string;
  userFullName: string;
  userEmail: string;
  paymentReference?: string;
  slaTier: string;
  firstResponseDue?: string;
  resolutionDue?: string;
  satisfactionRating?: number;
}

interface TicketConversationProps {
  ticketId: string;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  isAdmin?: boolean;
  onBack?: () => void;
}

export function TicketConversation({ ticketId, user, isAdmin = false, onBack }: TicketConversationProps) {
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTicketDetails();
    fetchMessages();
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchTicketDetails = async () => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`);
      if (!response.ok) throw new Error("Failed to fetch ticket");
      
      const data = await response.json();
      setTicket(data.ticket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage })
      });

      if (!response.ok) throw new Error("Failed to send message");
      
      setNewMessage("");
      fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { className: "bg-blue-100 text-blue-800", label: "Open" },
      assigned: { className: "bg-purple-100 text-purple-800", label: "Assigned" },
      in_progress: { className: "bg-amber-100 text-amber-800", label: "In Progress" },
      resolved: { className: "bg-emerald-100 text-emerald-800", label: "Resolved" },
      closed: { className: "bg-gray-100 text-gray-800", label: "Closed" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { className: "bg-gray-100 text-gray-800", label: status };

    return <Badge className={config.className}>{config.label}</Badge>;
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

    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  if (loading || !ticket) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[800px]">
      {/* Header */}
      <div className="border-b p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h1 className="text-xl font-semibold">{ticket.subject}</h1>
              <p className="text-sm text-gray-600">
                Ticket #{ticket.id.slice(-8)} • Created {formatRelativeTime(ticket.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.priority)}
          </div>
        </div>

        {/* Ticket Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Customer:</span>
            <p className="font-medium">{ticket.userFullName}</p>
            <p className="text-gray-600">{ticket.userEmail}</p>
          </div>
          {ticket.assignedAdminName && (
            <div>
              <span className="text-gray-500">Assigned to:</span>
              <p className="font-medium">{ticket.assignedAdminName}</p>
            </div>
          )}
          {ticket.paymentReference && (
            <div>
              <span className="text-gray-500">Payment Ref:</span>
              <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {ticket.paymentReference}
              </p>
            </div>
          )}
        </div>

        {/* SLA Info */}
        {(ticket.firstResponseDue || ticket.resolutionDue) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-4 text-sm">
              {ticket.firstResponseDue && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Response due: {formatRelativeTime(ticket.firstResponseDue)}</span>
                </div>
              )}
              {ticket.resolutionDue && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span>Resolution due: {formatRelativeTime(ticket.resolutionDue)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.senderId === user.id}
            isAdmin={isAdmin}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {ticket.status !== "closed" && (
        <div className="border-t p-4 bg-white">
          <div className="flex gap-2">
            <div className="flex-1">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[60px] resize-none"
                disabled={sending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="border-t p-4 bg-white">
        <div className="flex justify-between">
          <div className="flex gap-2">
            {ticket.status === "resolved" && !ticket.satisfactionRating && !isAdmin && (
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4 mr-2" />
                Rate Support
              </Button>
            )}
            {ticket.status === "closed" && !isAdmin && (
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reopen Ticket
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Customer
                </Button>
                <Button variant="outline" size="sm">
                  <Flag className="h-4 w-4 mr-2" />
                  Escalate
                </Button>
                {ticket.status !== "resolved" && (
                  <Button size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Resolved
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ 
  message, 
  isOwn, 
  isAdmin 
}: { 
  message: TicketMessage; 
  isOwn: boolean; 
  isAdmin: boolean;
}) {
  const getSenderIcon = () => {
    switch (message.senderType) {
      case "system":
        return <Bot className="h-4 w-4" />;
      case "agent":
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getSenderName = () => {
    switch (message.senderType) {
      case "system":
        return "System";
      case "agent":
        return message.senderName || "Support Agent";
      default:
        return isOwn ? "You" : message.senderName || "Customer";
    }
  };

  const getBubbleStyle = () => {
    if (message.senderType === "system") {
      return "bg-blue-50 border border-blue-200 text-blue-800";
    }
    if (message.senderType === "agent") {
      return "bg-white border border-gray-200";
    }
    if (isOwn) {
      return "bg-blue-500 text-white ml-auto";
    }
    return "bg-white border border-gray-200";
  };

  const getAlignment = () => {
    if (message.senderType === "system") return "mx-auto max-w-md";
    if (isOwn) return "ml-auto max-w-md";
    return "mr-auto max-w-md";
  };

  return (
    <div className={`${getAlignment()}`}>
      <div className={`p-4 rounded-lg ${getBubbleStyle()}`}>
        {/* Sender Info */}
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {getSenderIcon()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{getSenderName()}</span>
          <span className="text-xs text-gray-500">
            {formatRelativeTime(message.createdAt)}
          </span>
        </div>

        {/* Message Content */}
        <div className="text-sm whitespace-pre-wrap">
          {message.message}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.attachments.map((attachment, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                <Paperclip className="h-3 w-3" />
                <span>{attachment.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Read Status */}
        {isOwn && message.readAt && (
          <div className="text-xs text-gray-500 mt-1">
            Read {formatRelativeTime(message.readAt)}
          </div>
        )}
      </div>
    </div>
  );
}