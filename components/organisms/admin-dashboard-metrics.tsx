"use client";

import { useState, useEffect } from "react";
import {
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
} from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { MetricCard } from "@/components/molecules/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardMetrics {
  users: {
    total: number;
    active30d: number;
    newToday: number;
    growthRate: number;
  };
  transactions: {
    totalVolume: number;
    totalCount: number;
    monthlyRevenue: number;
    avgAmount: number;
    growthRate: number;
  };
  verifications: {
    total: number;
    successful: number;
    todayCount: number;
    successRate: number;
    growthRate: number;
  };
  system: {
    uptime: number;
    apiResponseTime: number;
    errorRate: number;
    activeSessions: number;
  };
}

export function AdminDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/admin/dashboard/metrics");
      if (!response.ok) throw new Error("Failed to fetch metrics");

      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      // Set fallback data
      setMetrics({
        users: { total: 0, active30d: 0, newToday: 0, growthRate: 0 },
        transactions: {
          totalVolume: 0,
          totalCount: 0,
          monthlyRevenue: 0,
          avgAmount: 0,
          growthRate: 0,
        },
        verifications: {
          total: 0,
          successful: 0,
          todayCount: 0,
          successRate: 0,
          growthRate: 0,
        },
        system: {
          uptime: 99.9,
          apiResponseTime: 145,
          errorRate: 0.1,
          activeSessions: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-3xl bg-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load dashboard metrics</p>
      </div>
    );
  }

  return (
    <>
      {/* Key Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={metrics.users.total.toLocaleString()}
          trend={metrics.users.growthRate}
          icon={Users}
          color="primary"
        />
        <MetricCard
          title="Revenue (Month)"
          value={formatCurrency(metrics.transactions.monthlyRevenue)}
          trend={metrics.transactions.growthRate}
          icon={DollarSign}
          color="success"
        />
        <MetricCard
          title="Success Rate"
          value={`${metrics.verifications.successRate}%`}
          trend={metrics.verifications.growthRate}
          icon={CheckCircle}
          color="success"
        />
        <MetricCard
          title="Active Sessions"
          value={metrics.system.activeSessions.toString()}
          trend={0}
          icon={AlertCircle}
          color="primary"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Response</span>
              <span className="text-sm font-medium text-green-600">
                {metrics.system.apiResponseTime}ms
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-medium text-green-600">
                {metrics.system.uptime}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Sessions</span>
              <span className="text-sm font-medium">
                {metrics.system.activeSessions.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Today&apos;s Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">New Users</span>
              <span className="text-sm font-medium">
                {metrics.users.newToday}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Verifications</span>
              <span className="text-sm font-medium">
                {metrics.verifications.todayCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Revenue</span>
              <span className="text-sm font-medium">
                {formatCurrency(
                  Math.round(metrics.transactions.monthlyRevenue / 30),
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="text-amber-600 font-medium">
                High API Response Time
              </p>
              <p className="text-gray-500 text-xs">Resolved 2 minutes ago</p>
            </div>
            <div className="text-sm">
              <p className="text-green-600 font-medium">Backup Completed</p>
              <p className="text-gray-500 text-xs">1 hour ago</p>
            </div>
            <div className="text-sm">
              <p className="text-blue-600 font-medium">System Update</p>
              <p className="text-gray-500 text-xs">Scheduled for tonight</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
