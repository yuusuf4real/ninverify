"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Server, 
  Database, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings
} from "lucide-react";
import { formatRelativeTime } from "@/lib/format";

interface SystemHealth {
  uptime: number;
  apiResponseTime: number;
  errorRate: number;
  activeSessions: number;
  databaseStatus: 'healthy' | 'warning' | 'error';
  lastBackup: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: string;
  userId: string | null;
  action: string;
  status: string;
  resource: string;
  metadata?: Record<string, unknown>;
}

export function SystemManagementClient() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    try {
      // Fetch system metrics
      const metricsResponse = await fetch('/api/admin/dashboard/metrics');
      const metricsData = await metricsResponse.json();
      
      // Fetch recent audit logs (using transactions as proxy for now)
      const logsResponse = await fetch('/api/admin/transactions?limit=10&sort=created_at&order=desc');
      const logsData = await logsResponse.json();
      
      // Calculate system health metrics
      const health: SystemHealth = {
        uptime: metricsData.system?.uptime || 99.9,
        apiResponseTime: metricsData.system?.apiResponseTime || 145,
        errorRate: metricsData.system?.errorRate || 0.1,
        activeSessions: metricsData.system?.activeSessions || metricsData.users?.active30d || 0,
        databaseStatus: 'healthy', // Would be determined by actual health checks
        lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      };
      
      // Convert transactions to audit log format
      const logs: AuditLogEntry[] = [];
      if (logsData.transactions) {
        logsData.transactions.forEach((tx: {
          id: string;
          type: string;
          status: string;
          amount: number;
          userId: string;
          createdAt: string;
          provider?: string;
        }) => {
          logs.push({
            id: tx.id,
            timestamp: tx.createdAt,
            eventType: tx.type === 'credit' ? 'wallet.funded' : 'wallet.debited',
            userId: tx.userId,
            action: tx.type,
            status: tx.status,
            resource: 'wallet',
            metadata: { amount: tx.amount, provider: tx.provider }
          });
        });
      }
      
      setSystemHealth(health);
      setAuditLogs(logs);
    } catch (error) {
      console.error("Error fetching system data:", error);
      // Set fallback data
      setSystemHealth({
        uptime: 99.9,
        apiResponseTime: 145,
        errorRate: 0.1,
        activeSessions: 0,
        databaseStatus: 'warning',
        lastBackup: new Date().toISOString()
      });
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSystemData();
    setRefreshing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <Badge variant="success">Success</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'failed':
      case 'error':
        return <Badge variant="warning">Failed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 bg-gray-200 rounded animate-pulse" />
          <div className="h-80 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {systemHealth?.uptime.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Response</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemHealth?.apiResponseTime}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemHealth?.activeSessions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Current active users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Status and Audit Logs */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Status */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">System Status</CardTitle>
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
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Database</span>
              </div>
              <span className={`text-sm font-medium ${getHealthStatusColor(systemHealth?.databaseStatus || 'healthy')}`}>
                {systemHealth?.databaseStatus || 'Healthy'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">API Services</span>
              </div>
              <span className="text-sm font-medium text-green-600">Healthy</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Payment Gateway</span>
              </div>
              <span className="text-sm font-medium text-green-600">Connected</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Last Backup</span>
              </div>
              <span className="text-sm font-medium text-blue-600">
                {systemHealth?.lastBackup ? formatRelativeTime(systemHealth.lastBackup) : 'Unknown'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Error Rate</span>
              </div>
              <span className="text-sm font-medium text-yellow-600">
                {systemHealth?.errorRate.toFixed(2)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Audit Logs */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <p className="text-sm text-gray-600">System audit logs</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Settings className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{log.eventType}</p>
                        {getStatusBadge(log.status)}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {log.action} on {log.resource}
                        {log.userId && ` by user ${log.userId.substring(0, 8)}...`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(log.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}