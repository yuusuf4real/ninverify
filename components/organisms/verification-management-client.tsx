"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Download,
  Eye,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Shield,
  XCircle,
  RefreshCw,
  MoreHorizontal,
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
import { formatDate } from "@/lib/format";

interface Verification {
  id: string;
  userId: string;
  ninMasked: string;
  consent: boolean;
  status: string;
  purpose: string | null;
  fullName: string | null;
  dateOfBirth: string | null;
  phone: string | null;
  providerReference: string | null;
  errorMessage: string | null;
  createdAt: string;
  userEmail: string;
  userFullName: string;
}

interface VerificationSummary {
  totalVerifications: number;
  successfulVerifications: number;
  failedVerifications: number;
  pendingVerifications: number;
  successRate: number;
  todayCount: number;
}

interface VerificationListResponse {
  verifications: Verification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: VerificationSummary;
}

export function VerificationManagementClient() {
  const searchParams = useSearchParams();

  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [summary, setSummary] = useState<VerificationSummary | null>(null);
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
  const [purpose, setPurpose] = useState(searchParams.get("purpose") || "all");
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort") || "created_at",
  );
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("order") || "desc",
  );

  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status,
        purpose,
        sort: sortBy,
        order: sortOrder,
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/verifications?${params}`);
      if (!response.ok) throw new Error("Failed to fetch verifications");

      const data: VerificationListResponse = await response.json();
      setVerifications(data.verifications);
      setPagination(data.pagination);
      setSummary(data.summary);
    } catch (error) {
      console.error("Error fetching verifications:", error);
      // Set fallback data
      setVerifications([]);
      setSummary({
        totalVerifications: 0,
        successfulVerifications: 0,
        failedVerifications: 0,
        pendingVerifications: 0,
        successRate: 0,
        todayCount: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    search,
    status,
    purpose,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVerifications();
    setRefreshing(false);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePurposeChange = (value: string) => {
    setPurpose(value);
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      success: {
        className: "bg-emerald-100 text-emerald-800",
        label: "Success",
      },
      failed: { className: "bg-red-100 text-red-800", label: "Failed" },
      pending: { className: "bg-amber-100 text-amber-800", label: "Pending" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      className: "bg-gray-100 text-gray-800",
      label: status,
    };

    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPurposeLabel = (purpose: string | null) => {
    if (!purpose) return "Unknown";

    const purposeLabels = {
      banking: "Banking",
      education_jamb: "JAMB",
      education_waec: "WAEC",
      education_neco: "NECO",
      education_nysc: "NYSC",
      passport: "Passport",
      drivers_license: "Driver's License",
      employment: "Employment",
      telecommunications: "Telecommunications",
      government_service: "Government Service",
      other: "Other",
    };

    return purposeLabels[purpose as keyof typeof purposeLabels] || purpose;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Total Verifications</p>
                  <p className="text-2xl font-bold">
                    {summary.totalVerifications.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">Success Rate</p>
                  <p className="text-2xl font-bold">
                    {summary.successRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Failed</p>
                  <p className="text-2xl font-bold">
                    {summary.failedVerifications}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Today</p>
                  <p className="text-2xl font-bold">{summary.todayCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by NIN, user, or reference..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={purpose} onValueChange={handlePurposeChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Purposes</SelectItem>
                  <SelectItem value="banking">Banking</SelectItem>
                  <SelectItem value="education_jamb">JAMB</SelectItem>
                  <SelectItem value="education_waec">WAEC</SelectItem>
                  <SelectItem value="employment">Employment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
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

      {/* Verifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            NIN Verifications ({pagination.total.toLocaleString()})
          </CardTitle>
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
                    <TableHead>NIN</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSortChange("status")}
                    >
                      Status {getSortIcon("status")}
                    </TableHead>
                    <TableHead>Verified Name</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSortChange("created_at")}
                    >
                      Date {getSortIcon("created_at")}
                    </TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifications.map((verification) => (
                    <TableRow key={verification.id}>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {verification.ninMasked}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {verification.userFullName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {verification.userEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {getPurposeLabel(verification.purpose)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(verification.status)}
                      </TableCell>
                      <TableCell>
                        {verification.fullName ? (
                          <div>
                            <p className="font-medium">
                              {verification.fullName}
                            </p>
                            {verification.dateOfBirth && (
                              <p className="text-sm text-gray-500">
                                DOB: {verification.dateOfBirth}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(verification.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {verification.status === "failed" &&
                              verification.errorMessage && (
                                <DropdownMenuItem>
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  View Error
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
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{" "}
                  of {pagination.total} verifications
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
    </div>
  );
}
