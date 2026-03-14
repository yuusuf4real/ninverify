"use client";

import React from "react";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  CreditCard, 
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Activity
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";

interface DashboardData {
  revenueChart: Array<{ date: string; amount: number }>;
  userGrowth: Array<{ date: string; count: number }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

export function AdminDashboardClient() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch real revenue data from transactions
      const revenueResponse = await fetch('/api/admin/transactions?limit=7&sort=created_at&order=desc');
      const revenueData = await revenueResponse.json();
      
      // Fetch real user growth data
      const usersResponse = await fetch('/api/admin/users?limit=7&sort=created_at&order=desc');
      const usersData = await usersResponse.json();
      
      // Process revenue data by day
      const revenueByDay = new Map<string, number>();
      const today = new Date();
      
      // Initialize last 7 days with 0
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        revenueByDay.set(dateStr, 0);
      }
      
      // Aggregate actual revenue data
      if (revenueData.transactions) {
        revenueData.transactions.forEach((tx: {
          id: string;
          status: string;
          type: string;
          amount: number;
          createdAt: string;
          userEmail?: string;
        }) => {
          if (tx.status === 'completed' && tx.type === 'credit') {
            const txDate = new Date(tx.createdAt);
            const dateStr = txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (revenueByDay.has(dateStr)) {
              revenueByDay.set(dateStr, revenueByDay.get(dateStr)! + tx.amount);
            }
          }
        });
      }
      
      // Process user growth data by day
      const usersByDay = new Map<string, number>();
      
      // Initialize last 7 days with 0
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        usersByDay.set(dateStr, 0);
      }
      
      // Aggregate actual user data
      if (usersData.users) {
        usersData.users.forEach((user: {
          id: string;
          email: string;
          createdAt: string;
        }) => {
          const userDate = new Date(user.createdAt);
          const dateStr = userDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (usersByDay.has(dateStr)) {
            usersByDay.set(dateStr, usersByDay.get(dateStr)! + 1);
          }
        });
      }
      
      // Get recent activity from audit logs or transactions
      const recentActivity: Array<{
        id: string;
        type: string;
        description: string;
        timestamp: string;
        icon: React.ComponentType<{ className?: string }>;
      }> = [];
      
      // Add recent transactions as activity
      if (revenueData.transactions) {
        revenueData.transactions.slice(0, 4).forEach((tx: {
          id: string;
          status: string;
          type: string;
          amount: number;
          createdAt: string;
          userEmail?: string;
        }) => {
          recentActivity.push({
            id: `tx_${tx.id}`,
            type: tx.type === 'credit' ? 'payment_completed' : 'payment_failed',
            description: `Payment of ${formatCurrency(tx.amount)} ${tx.status} for user ${tx.userEmail || 'Unknown'}`,
            timestamp: getRelativeTime(tx.createdAt),
            icon: CreditCard
          });
        });
      }
      
      // Add recent user registrations as activity
      if (usersData.users) {
        usersData.users.slice(0, 2).forEach((user: {
          id: string;
          email: string;
          createdAt: string;
        }) => {
          recentActivity.push({
            id: `user_${user.id}`,
            type: 'user_registered',
            description: `New user ${user.email} registered`,
            timestamp: getRelativeTime(user.createdAt),
            icon: Users
          });
        });
      }
      
      const processedData: DashboardData = {
        revenueChart: Array.from(revenueByDay.entries()).map(([date, amount]) => ({
          date,
          amount
        })),
        userGrowth: Array.from(usersByDay.entries()).map(([date, count]) => ({
          date,
          count
        })),
        recentActivity: recentActivity.slice(0, 4)
      };
      
      setDashboardData(processedData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Set empty data structure on error
      setDashboardData({
        revenueChart: [],
        userGrowth: [],
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-80 bg-gray-200 rounded animate-pulse" />
        <div className="h-80 bg-gray-200 rounded animate-pulse" />
        <div className="h-80 bg-gray-200 rounded animate-pulse" />
        <div className="h-80 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load dashboard data</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const totalRevenue = dashboardData.revenueChart.reduce((sum, item) => sum + item.amount, 0);
  const avgDailyUsers = dashboardData.userGrowth.length > 0 
    ? Math.round(dashboardData.userGrowth.reduce((sum, item) => sum + item.count, 0) / dashboardData.userGrowth.length)
    : 0;

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
          {dashboardData.revenueChart.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.revenueChart.map((item, index) => {
                const maxAmount = Math.max(...dashboardData.revenueChart.map(i => i.amount));
                const width = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-12 text-xs text-gray-500">{item.date}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-6 bg-primary rounded"
                          style={{ width: `${Math.max(width, 2)}%` }}
                        />
                        <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No revenue data available</p>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total this week</span>
              <span className="font-semibold">{formatCurrency(totalRevenue)}</span>
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
          {dashboardData.recentActivity.length > 0 ? (
            dashboardData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                  <activity.icon className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No recent activity</p>
            </div>
          )}
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
          {dashboardData.userGrowth.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.userGrowth.map((item, index) => {
                const maxCount = Math.max(...dashboardData.userGrowth.map(i => i.count));
                const width = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-12 text-xs text-gray-500">{item.date}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-4 bg-emerald-500 rounded"
                          style={{ width: `${Math.max(width, 2)}%` }}
                        />
                        <span className="text-sm font-medium">{item.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No user data available</p>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Average daily</span>
              <span className="font-semibold">{avgDailyUsers} users</span>
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
            <Link href="/admin/verifications">
              <BarChart3 className="h-4 w-4" />
              NIN Verifications
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start gap-2">
            <Link href="/admin/analytics">
              <Activity className="h-4 w-4" />
              View Analytics
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}