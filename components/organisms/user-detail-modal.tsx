"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign,
  Activity,
  CreditCard,
  Shield,
  UserX,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/format";
import { NIN_VERIFICATION_COST_NAIRA } from "@/lib/constants";

interface UserDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  isSuspended: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  balance: number;
  walletId: string;
}

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  status: string;
  description: string;
  createdAt: string;
}

interface Verification {
  id: string;
  nin: string;
  status: string;
  cost: number;
  createdAt: string;
}

interface UserStats {
  totalSpent: number;
  successfulVerifications: number;
  accountAge: number;
}

interface UserDetailResponse {
  user: UserDetail;
  transactions: Transaction[];
  verifications: Verification[];
  stats: UserStats;
}

interface UserDetailModalProps {
  userId: string;
  open: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

export function UserDetailModal({ userId, open, onClose, onUserUpdated }: UserDetailModalProps) {
  const [userDetail, setUserDetail] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUserDetail = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user details");
      
      const data: UserDetailResponse = await response.json();
      setUserDetail(data);
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open && userId) {
      fetchUserDetail();
    }
  }, [open, userId, fetchUserDetail]);

  const handleUserAction = async (action: "suspend" | "activate") => {
    if (!userDetail) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: action === "suspend" ? "Administrative action" : undefined
        })
      });

      if (!response.ok) throw new Error(`Failed to ${action} user`);
      
      // Update local state
      setUserDetail(prev => prev ? {
        ...prev,
        user: { ...prev.user, isSuspended: action === "suspend" }
      } : null);
      
      // Notify parent to refresh
      onUserUpdated();
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (isSuspended: boolean) => {
    if (isSuspended) {
      return <Badge variant="warning">Suspended</Badge>;
    }
    return <Badge variant="success">Active</Badge>;
  };

  const getTransactionStatusBadge = (status: string) => {
    const statusColors = {
      completed: "bg-emerald-100 text-emerald-800",
      pending: "bg-amber-100 text-amber-800",
      failed: "bg-red-100 text-red-800"
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  const getVerificationStatusBadge = (status: string) => {
    const statusColors = {
      success: "bg-emerald-100 text-emerald-800",
      failed: "bg-red-100 text-red-800",
      pending: "bg-amber-100 text-amber-800"
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <div className="h-32 bg-gray-100 rounded animate-pulse" />
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          </div>
        ) : userDetail ? (
          <div className="space-y-6">
            {/* User Profile Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="text-xl font-semibold">
                        {userDetail.user.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{userDetail.user.fullName}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {userDetail.user.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {userDetail.user.phone}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(userDetail.user.isSuspended)}
                        <span className="text-sm text-gray-500">
                          Joined {formatDate(userDetail.user.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {userDetail.user.isSuspended ? (
                      <Button
                        onClick={() => handleUserAction("activate")}
                        disabled={actionLoading}
                        size="sm"
                        className="gap-2"
                      >
                        <UserCheck className="h-4 w-4" />
                        Activate User
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleUserAction("suspend")}
                        disabled={actionLoading}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <UserX className="h-4 w-4" />
                        Suspend User
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Wallet Balance</p>
                      <p className="text-xl font-bold">{formatCurrency(userDetail.user.balance || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Total Spent</p>
                      <p className="text-xl font-bold">{formatCurrency(userDetail.stats.totalSpent)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">Verifications</p>
                      <p className="text-xl font-bold">{userDetail.stats.successfulVerifications}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Account Age</p>
                      <p className="text-xl font-bold">{userDetail.stats.accountAge} days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Information Tabs */}
            <Tabs defaultValue="transactions" className="space-y-4">
              <TabsList>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="verifications">Verifications</TabsTrigger>
                <TabsTrigger value="activity">Activity Log</TabsTrigger>
              </TabsList>

              <TabsContent value="transactions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userDetail.transactions.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No transactions found</p>
                    ) : (
                      <div className="space-y-4">
                        {userDetail.transactions.map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${
                                transaction.type === "credit" ? "bg-emerald-100" : "bg-red-100"
                              }`}>
                                <CreditCard className={`h-4 w-4 ${
                                  transaction.type === "credit" ? "text-emerald-600" : "text-red-600"
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium">{transaction.description}</p>
                                <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${
                                transaction.type === "credit" ? "text-emerald-600" : "text-red-600"
                              }`}>
                                {transaction.type === "credit" ? "+" : "-"}{formatCurrency(transaction.amount)}
                              </p>
                              {getTransactionStatusBadge(transaction.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="verifications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>NIN Verifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userDetail.verifications.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No verifications found</p>
                    ) : (
                      <div className="space-y-4">
                        {userDetail.verifications.map((verification) => (
                          <div key={verification.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-blue-100">
                                <Shield className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">NIN: {verification.nin}</p>
                                <p className="text-sm text-gray-500">{formatDate(verification.createdAt)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">₦{NIN_VERIFICATION_COST_NAIRA}</p>
                              {getVerificationStatusBadge(verification.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 border rounded-lg">
                        <div className="p-2 rounded-full bg-blue-100">
                          <Activity className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Account created</p>
                          <p className="text-sm text-gray-500">{formatDate(userDetail.user.createdAt)}</p>
                        </div>
                      </div>
                      {userDetail.user.lastLoginAt && (
                        <div className="flex items-center gap-3 p-4 border rounded-lg">
                          <div className="p-2 rounded-full bg-emerald-100">
                            <Activity className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium">Last login</p>
                            <p className="text-sm text-gray-500">{formatDate(userDetail.user.lastLoginAt)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Failed to load user details</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}