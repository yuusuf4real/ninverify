"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  CreditCard, 
  ArrowRight,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

// Mock chart data - will be replaced with real data
const mockChartData = {
  revenue: [
    { date: "Mar 1", amount: 45000 },
    { date: "Mar 2", amount: 52000 },
    { date: "Mar 3", amount: 48000 },
    { date: "Mar 4", amount: 61000 },
    { date: "Mar 5", amount: 55000 },
    { date: "Mar 6", amount: 67000 },
    { date: "Mar 7", amount: 59000 }
  ],
  users: [
    { date: "Mar 1", count: 42 },
    { date: "Mar 2", count: 38 },
    { date: "Mar 3", count: 45 },
    { date: "Mar 4", count: 52 },
    { date: "Mar 5", count: 48 },
    { date: "Mar 6", count: 55 },
    { date: "Mar 7", count: 61 }
  ]
};

const mockRecentActivity = [
  {
    id: 1,
    type: "user_registered",
    description: "New user john@email.com registered",
    timestamp: "2 minutes ago",
    icon: Users
  },
  {
    id: 2,
    type: "payment_completed",
    description: "Payment of ₦1,000 completed for user jane@email.com",
    timestamp: "5 minutes ago",
    icon: CreditCard
  },
  {
    id: 3,
    type: "verification_success",
    description: "NIN verification successful for user bob@email.com",
    timestamp: "8 minutes ago",
    icon: BarChart3
  },
  {
    id: 4,
    type: "user_registered",
    description: "New user alice@email.com registered",
    timestamp: "12 minutes ago",
    icon: Users
  }
];

export function AdminDashboardClient() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Revenue Chart */}
      <Card className="lg:col-span-2 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
            <p className="text-sm text-gray-600">Last 7 days</p>
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
        </CardHeader>
        <CardContent>
          {/* Simple bar chart representation */}
          <div className="space-y-4">
            {mockChartData.revenue.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-12 text-xs text-gray-500">{item.date}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-6 bg-primary rounded"
                      style={{ width: `${(item.amount / 70000) * 100}%` }}
                    />
                    <span className="text-sm font-medium">₦{item.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total this week</span>
              <span className="font-semibold">₦387,000</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <p className="text-sm text-gray-600">Live updates</p>
          </div>
          <div className="flex h-2 w-2 rounded-full bg-green-500">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockRecentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                <activity.icon className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500">{activity.timestamp}</p>
              </div>
            </div>
          ))}
          <div className="pt-2">
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80"
            >
              View all activity
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* User Growth Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">User Growth</CardTitle>
          <p className="text-sm text-gray-600">Daily registrations</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockChartData.users.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-12 text-xs text-gray-500">{item.date}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-4 bg-emerald-500 rounded"
                      style={{ width: `${(item.count / 70) * 100}%` }}
                    />
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Average daily</span>
              <span className="font-semibold">49 users</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild variant="outline" className="w-full justify-start gap-2">
            <Link href="/admin/users">
              <Users className="h-4 w-4" />
              Manage Users
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start gap-2">
            <Link href="/admin/transactions">
              <CreditCard className="h-4 w-4" />
              View Transactions
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start gap-2">
            <Link href="/admin/support">
              <ExternalLink className="h-4 w-4" />
              Support Tickets
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start gap-2">
            <Link href="/admin/analytics">
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}