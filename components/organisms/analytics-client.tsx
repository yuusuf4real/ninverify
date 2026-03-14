"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { formatPercentage, formatRelativeTime } from "@/lib/format";

interface AnalyticsData {
  overview: {
    totalVerifications: number;
    successfulVerifications: number;
    failedVerifications: number;
    pendingVerifications: number;
    successRate: number;
    avgProcessingTime: number;
    todayCount: number;
    todaySuccessRate: number;
  };
  trends: {
    daily: Array<{
      date: string;
      total: number;
      successful: number;
      failed: number;
      successRate: number;
    }>;
  };
  breakdown: {
    byPurpose: Array<{
      purpose: string;
      count: number;
      successCount: number;
      successRate: number;
    }>;
  };
  errors: {
    topErrors: Array<{
      message: string;
      count: number;
    }>;
  };
  recent: Array<{
    id: string;
    status: string;
    purpose: string;
    createdAt: string;
    errorMessage?: string;
    userEmail?: string;
    userFullName?: string;
  }>;
}

export function AnalyticsClient() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/verifications/analytics?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set empty data structure on error
      setAnalytics({
        overview: {
          totalVerifications: 0,
          successfulVerifications: 0,
          failedVerifications: 0,
          pendingVerifications: 0,
          successRate: 0,
          avgProcessingTime: 0,
          todayCount: 0,
          todaySuccessRate: 0
        },
        trends: { daily: [] },
        breakdown: { byPurpose: [] },
        errors: { topErrors: [] },
        recent: []
      });
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="success">Success</Badge>;
      case 'failed':
        return <Badge variant="warning">Failed</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const formatPurpose = (purpose: string | null) => {
    if (!purpose) return 'Unknown';
    return purpose.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 bg-gray-200 rounded animate-pulse" />
          <div className="h-80 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load analytics data</p>
        <Button onClick={fetchAnalytics} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Verification Analytics</h2>
          <p className="text-gray-600">Detailed insights into NIN verification performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 p-1">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  period === p
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalVerifications.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.todayCount} today
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercentage(analytics.overview.successRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              Today: {formatPercentage(analytics.overview.todaySuccessRate)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.overview.successfulVerifications.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed successfully
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analytics.overview.failedVerifications.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.pendingVerifications} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Trends */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Daily Verification Trends</CardTitle>
            <p className="text-sm text-gray-600">Success vs failure rates over time</p>
          </CardHeader>
          <CardContent>
            {analytics.trends.daily.length > 0 ? (
              <div className="space-y-4">
                {analytics.trends.daily.map((day, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{day.date}</span>
                      <span className="text-gray-600">{day.total} total</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-4 bg-emerald-500 rounded"
                          style={{ width: `${Math.max((day.successful / Math.max(...analytics.trends.daily.map(d => d.total))) * 100, 5)}%` }}
                        />
                        <span className="text-sm font-medium text-emerald-600">{day.successful}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2 bg-red-300 rounded"
                          style={{ width: `${Math.max((day.failed / Math.max(...analytics.trends.daily.map(d => d.total))) * 100, 2)}%` }}
                        />
                        <span className="text-xs text-red-600">{day.failed} failed</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No trend data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Purpose Breakdown */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Verification by Purpose</CardTitle>
            <p className="text-sm text-gray-600">Most common verification purposes</p>
          </CardHeader>
          <CardContent>
            {analytics.breakdown.byPurpose.length > 0 ? (
              <div className="space-y-4">
                {analytics.breakdown.byPurpose.slice(0, 6).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{formatPurpose(item.purpose)}</span>
                        <span className="text-sm text-gray-600">{item.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(item.count / Math.max(...analytics.breakdown.byPurpose.map(p => p.count))) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {formatPercentage(item.successRate)} success rate
                        </span>
                        <span className="text-xs text-green-600">
                          {item.successCount} successful
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No purpose data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Errors */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Common Errors</CardTitle>
            <p className="text-sm text-gray-600">Most frequent failure reasons</p>
          </CardHeader>
          <CardContent>
            {analytics.errors.topErrors.length > 0 ? (
              <div className="space-y-3">
                {analytics.errors.topErrors.slice(0, 5).map((error, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900">{error.message}</p>
                      <p className="text-xs text-red-600">{error.count} occurrences</p>
                    </div>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No error data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Verifications */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Verifications</CardTitle>
            <p className="text-sm text-gray-600">Latest verification attempts</p>
          </CardHeader>
          <CardContent>
            {analytics.recent.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {analytics.recent.map((verification) => (
                  <div key={verification.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    {getStatusIcon(verification.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{formatPurpose(verification.purpose)}</p>
                        {getStatusBadge(verification.status)}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {verification.userEmail || 'Unknown user'}
                      </p>
                      {verification.errorMessage && (
                        <p className="text-xs text-red-600 mt-1">{verification.errorMessage}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(verification.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recent verifications</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}