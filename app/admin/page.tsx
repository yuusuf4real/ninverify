import { Suspense } from "react";
import { 
  Users, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Activity
} from "lucide-react";

import { AdminDashboardClient } from "@/components/organisms/admin-dashboard-client";
import { MetricCard } from "@/components/molecules/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data - will be replaced with real API calls
const mockMetrics = {
  users: {
    total: 12345,
    growth: 12.5,
    active30d: 8234
  },
  revenue: {
    total: 2450000,
    growth: 8.2,
    thisMonth: 450000
  },
  verifications: {
    successRate: 98.5,
    growth: 2.1,
    total: 23456
  },
  tickets: {
    open: 23,
    growth: -15,
    resolved: 156
  }
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-3xl bg-gray-200 animate-pulse" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-3xl bg-gray-200 animate-pulse" />
        <div className="h-80 rounded-3xl bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome to the VerifyNIN admin portal. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={mockMetrics.users.total.toLocaleString()}
          trend={mockMetrics.users.growth}
          icon={Users}
          color="primary"
        />
        <MetricCard
          title="Revenue (Month)"
          value={`₦${(mockMetrics.revenue.thisMonth / 1000).toFixed(0)}K`}
          trend={mockMetrics.revenue.growth}
          icon={DollarSign}
          color="success"
        />
        <MetricCard
          title="Success Rate"
          value={`${mockMetrics.verifications.successRate}%`}
          trend={mockMetrics.verifications.growth}
          icon={CheckCircle}
          color="success"
        />
        <MetricCard
          title="Open Tickets"
          value={mockMetrics.tickets.open.toString()}
          trend={mockMetrics.tickets.growth}
          icon={AlertCircle}
          color="warning"
        />
      </div>

      {/* Dashboard Content */}
      <Suspense fallback={<DashboardSkeleton />}>
        <AdminDashboardClient />
      </Suspense>

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
              <span className="text-sm font-medium text-green-600">145ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-medium text-green-600">99.9%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Sessions</span>
              <span className="text-sm font-medium">1,234</span>
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
              <span className="text-sm font-medium">42</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Verifications</span>
              <span className="text-sm font-medium">156</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Revenue</span>
              <span className="text-sm font-medium">₦45,600</span>
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
              <p className="text-amber-600 font-medium">High API Response Time</p>
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
    </div>
  );
}