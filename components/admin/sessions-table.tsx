"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download, RefreshCw } from "lucide-react";

interface Session {
  id: string;
  phoneNumber: string;
  status: string;
  dataLayer?: string;
  paymentAmount?: number;
  createdAt: string;
  completedAt?: string;
}

export function SessionsTable() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      // This would be an actual API call in production
      // const response = await fetch('/api/admin/sessions');
      // const data = await response.json();
      
      // Mock data for now
      const mockSessions: Session[] = [
        {
          id: "sess_123",
          phoneNumber: "+234803***4567",
          status: "verification_completed",
          dataLayer: "demographic",
          paymentAmount: 500,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        },
        {
          id: "sess_124",
          phoneNumber: "+234701***8901",
          status: "payment_pending",
          dataLayer: "biometric",
          paymentAmount: 750,
          createdAt: new Date(Date.now() - 300000).toISOString(),
        },
        {
          id: "sess_125",
          phoneNumber: "+234809***2345",
          status: "verification_completed",
          dataLayer: "full",
          paymentAmount: 1000,
          createdAt: new Date(Date.now() - 600000).toISOString(),
          completedAt: new Date(Date.now() - 300000).toISOString(),
        },
      ];
      
      setSessions(mockSessions);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      otp_pending: { label: "OTP Pending", variant: "secondary" as const },
      otp_verified: { label: "OTP Verified", variant: "default" as const },
      nin_entered: { label: "NIN Entered", variant: "default" as const },
      payment_pending: { label: "Payment Pending", variant: "destructive" as const },
      payment_completed: { label: "Payment Done", variant: "default" as const },
      verification_completed: { label: "Completed", variant: "default" as const },
      failed: { label: "Failed", variant: "destructive" as const },
      expired: { label: "Expired", variant: "secondary" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "secondary" as const,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatAmount = (amount: number) => {
    return `₦${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {sessions.length} sessions found
        </p>
        <Button variant="outline" size="sm" onClick={fetchSessions}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session ID</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Layer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-mono text-sm">
                  {session.id}
                </TableCell>
                <TableCell>{session.phoneNumber}</TableCell>
                <TableCell>{getStatusBadge(session.status)}</TableCell>
                <TableCell>
                  {session.dataLayer ? (
                    <Badge variant="outline">
                      {session.dataLayer.charAt(0).toUpperCase() + session.dataLayer.slice(1)}
                    </Badge>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {session.paymentAmount ? formatAmount(session.paymentAmount) : "-"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(session.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {session.status === "verification_completed" && (
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}