"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AnimatedLogoLoader } from "@/components/ui/animated-logo-loader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/format";
import { cursorFromMessage, encodeTicketCursor } from "@/lib/support-stream";

interface TicketMessage {
  id: string;
  senderId: string;
  senderType: "user" | "agent" | "system";
  senderName?: string;
  message: string;
  messageType: "text" | "image" | "file" | "system_note";
  isInternal: boolean;
  attachments?: Array<{ name: string; url: string; type: string }>;
  createdAt: string;
  readAt?: string;
  clientStatus?: "sending" | "sent" | "failed";
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

export function TicketConversation({
  ticketId,
  user,
  isAdmin = false,
  onBack,
}: TicketConversationProps) {
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connectionState, setConnectionState] = useState<
    "connecting" | "live" | "reconnecting" | "error"
  >("connecting");
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const lastCursorRef = useRef<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isAtBottomRef = useRef(true);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateScrollState = useCallback(() => {
    const container = messageListRef.current;
    if (!container) return;
    const threshold = 120;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const atBottom = distanceFromBottom <= threshold;
    isAtBottomRef.current = atBottom;
    if (atBottom) {
      setUnreadCount(0);
    }
  }, []);

  const fetchTicketDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`);
      if (!response.ok) throw new Error("Failed to fetch ticket");

      const data = await response.json();
      setTicket(data.ticket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
    }
  }, [ticketId]);

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/messages`);
      if (!response.ok) throw new Error("Failed to fetch messages");

      const data = await response.json();
      const fetchedMessages = data.messages || [];
      setMessages((prev) => {
        const pending = prev.filter(
          (message) =>
            message.clientStatus === "sending" ||
            message.clientStatus === "failed",
        );
        const fetchedIds = new Set(
          fetchedMessages.map((message: { id: string }) => message.id),
        );
        const merged = [...fetchedMessages];
        for (const message of pending) {
          if (!fetchedIds.has(message.id)) {
            merged.push(message);
          }
        }
        return merged;
      });
      if (fetchedMessages.length) {
        lastCursorRef.current = encodeTicketCursor(
          cursorFromMessage(fetchedMessages[fetchedMessages.length - 1]),
        );
      } else {
        lastCursorRef.current = encodeTicketCursor({
          timestamp: Date.now() - 5000,
          id: "0",
        });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicketDetails();
    fetchMessages();
  }, [ticketId, fetchTicketDetails, fetchMessages]);

  useEffect(() => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (loading) return;

    const startPolling = () => {
      if (pollIntervalRef.current) return;
      pollIntervalRef.current = setInterval(fetchMessages, 5000);
    };

    const stopPolling = () => {
      if (!pollIntervalRef.current) return;
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    };

    if (typeof EventSource === "undefined") {
      setConnectionState("error");
      startPolling();
      return () => stopPolling();
    }

    const cursor = lastCursorRef.current;
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    const eventSource = new EventSource(
      `/api/support/tickets/${ticketId}/stream${query}`,
    );
    eventSourceRef.current = eventSource;
    setConnectionState("connecting");

    const handleMessages = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        const incoming: TicketMessage[] = payload.messages || [];
        if (!incoming.length) return;

        setMessages((prev) => {
          const existingIds = new Set(prev.map((message) => message.id));
          const nextMessages = [...prev];
          for (const message of incoming) {
            if (!existingIds.has(message.id)) {
              nextMessages.push(message);
            }
          }
          return nextMessages;
        });

        if (!isAtBottomRef.current) {
          setUnreadCount((count) => count + incoming.length);
        }

        if (payload.cursor) {
          lastCursorRef.current = payload.cursor;
        }
      } catch (error) {
        console.error("Error parsing stream message:", error);
      }
    };

    const handleReady = () => {
      setConnectionState("live");
    };

    eventSource.addEventListener("messages", handleMessages);
    eventSource.addEventListener("ready", handleReady);
    eventSource.onopen = () => {
      stopPolling();
      setConnectionState("live");
    };
    eventSource.onerror = () => {
      setConnectionState("reconnecting");
      startPolling();
    };

    return () => {
      eventSource.removeEventListener("messages", handleMessages);
      eventSource.removeEventListener("ready", handleReady);
      eventSource.close();
      stopPolling();
    };
  }, [ticketId, loading, fetchMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messagePayload = newMessage;
    const optimisticId = `local_${Date.now()}`;
    const optimisticMessage: TicketMessage = {
      id: optimisticId,
      senderId: user.id,
      senderType: isAdmin ? "agent" : "user",
      senderName: isAdmin ? "Support Agent" : user.fullName,
      message: messagePayload,
      messageType: "text",
      isInternal: false,
      createdAt: new Date().toISOString(),
      clientStatus: "sending",
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");
    setSending(true);
    try {
      const response = await fetch(
        `/api/support/tickets/${ticketId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: messagePayload }),
        },
      );

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();
      const resolvedId = data.messageId || optimisticId;
      setMessages((prev) => {
        const updated = prev.map((message) =>
          message.id === optimisticId
            ? {
                ...message,
                id: resolvedId,
                clientStatus: "sent" as const,
              }
            : message,
        );
        const seen = new Set<string>();
        return updated.filter((message) => {
          if (seen.has(message.id)) return false;
          seen.add(message.id);
          return true;
        });
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === optimisticId
            ? { ...message, clientStatus: "failed" }
            : message,
        ),
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToLatest = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadCount(0);
  };

  const connectionConfig = {
    live: {
      label: "Live",
      badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
    },
    connecting: {
      label: "Connecting",
      badge: "bg-blue-100 text-blue-700 border-blue-200",
      dot: "bg-blue-500",
    },
    reconnecting: {
      label: "Reconnecting",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
    },
    error: {
      label: "Offline",
      badge: "bg-rose-100 text-rose-700 border-rose-200",
      dot: "bg-rose-500",
    },
  } as const;

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

    return (
      <Badge variant="default" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loading || !ticket) {
    return (
      <div className="flex items-center justify-center h-64">
        <AnimatedLogoLoader size="md" message="Loading conversation..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[800px]">
      {/* Header */}
      <div className="border-b p-4 bg-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h1 className="text-xl font-semibold">{ticket.subject}</h1>
              <p className="text-sm text-gray-600">
                Ticket #{ticket.id.slice(-8)} • Created{" "}
                {formatRelativeTime(ticket.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="default"
              className={`${connectionConfig[connectionState].badge} flex items-center gap-2`}
            >
              <span
                className={`h-2 w-2 rounded-full ${connectionConfig[connectionState].dot}`}
              />
              {connectionConfig[connectionState].label}
            </Badge>
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
              <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded break-all">
                {ticket.paymentReference}
              </p>
            </div>
          )}
        </div>

        {/* SLA Info */}
        {(ticket.firstResponseDue || ticket.resolutionDue) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center">
              {ticket.firstResponseDue && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>
                    Response due: {formatRelativeTime(ticket.firstResponseDue)}
                  </span>
                </div>
              )}
              {ticket.resolutionDue && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span>
                    Resolution due: {formatRelativeTime(ticket.resolutionDue)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Messages */}
      <div
        ref={messageListRef}
        onScroll={updateScrollState}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
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
          {unreadCount > 0 && (
            <div className="mb-3 flex justify-center">
              <Button variant="outline" size="sm" onClick={scrollToLatest}>
                {unreadCount} new message{unreadCount > 1 ? "s" : ""} • View
                latest
              </Button>
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[60px] resize-none"
                disabled={sending}
              />
            </div>
            <div className="flex flex-row gap-2 sm:flex-col">
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {ticket.status === "resolved" &&
              !ticket.satisfactionRating &&
              !isAdmin && (
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

          <div className="flex flex-wrap gap-2">
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
        <div className="text-sm whitespace-pre-wrap">{message.message}</div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs text-gray-600"
              >
                <Paperclip className="h-3 w-3" />
                <span>{attachment.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Read Status */}
        {isOwn && (
          <div className="text-xs text-gray-500 mt-1">
            {message.clientStatus === "sending" && "Sending..."}
            {message.clientStatus === "failed" && "Failed to send"}
            {message.clientStatus === "sent" && "Sent"}
            {!message.clientStatus &&
              message.readAt &&
              `Read ${formatRelativeTime(message.readAt)}`}
            {!message.clientStatus && !message.readAt && "Sent"}
          </div>
        )}
      </div>
    </div>
  );
}
