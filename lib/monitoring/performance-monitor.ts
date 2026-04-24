/**
 * Performance Monitoring System
 *
 * Comprehensive performance monitoring for production deployment
 * including API response times, database queries, and system metrics.
 */

import { logger } from "@/lib/security/secure-logger";
import { auditLogger } from "@/lib/security/enhanced-audit-logger";
import { nanoid } from "nanoid";

export interface PerformanceMetric {
  id: string;
  name: string;
  type: "api" | "database" | "external_service" | "system" | "user_action";
  startTime: number;
  endTime?: number;
  duration?: number;
  status: "started" | "completed" | "failed";
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface APIMetric extends PerformanceMetric {
  type: "api";
  endpoint: string;
  method: string;
  statusCode?: number;
  responseSize?: number;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
}

export interface DatabaseMetric extends PerformanceMetric {
  type: "database";
  query: string;
  table: string;
  operation: "select" | "insert" | "update" | "delete";
  rowsAffected?: number;
  connectionPool?: {
    active: number;
    idle: number;
    total: number;
  };
}

export interface ExternalServiceMetric extends PerformanceMetric {
  type: "external_service";
  service: "youverify" | "paystack" | "termii" | "twilio";
  operation: string;
  statusCode?: number;
  retryCount?: number;
}

export interface SystemMetric extends PerformanceMetric {
  type: "system";
  metric: "memory" | "cpu" | "disk" | "network";
  value: number;
  unit: string;
  threshold?: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private aggregatedMetrics: Map<string, any> = new Map();
  private alertThresholds = {
    api_response_time: 2000, // 2 seconds
    database_query_time: 1000, // 1 second
    external_service_time: 5000, // 5 seconds
    memory_usage: 80, // 80%
    cpu_usage: 80, // 80%
  };

  private constructor() {
    // Start system metrics collection
    this.startSystemMetricsCollection();

    // Start metrics aggregation
    this.startMetricsAggregation();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startTiming(
    name: string,
    type: PerformanceMetric["type"],
    metadata?: Record<string, any>,
  ): string {
    const id = nanoid();
    const metric: PerformanceMetric = {
      id,
      name,
      type,
      startTime: performance.now(),
      status: "started",
      metadata,
    };

    this.metrics.set(id, metric);
    return id;
  }

  /**
   * End timing an operation
   */
  endTiming(
    id: string,
    status: "completed" | "failed" = "completed",
    additionalMetadata?: Record<string, any>,
  ): void {
    const metric = this.metrics.get(id);
    if (!metric) {
      logger.warn("Performance metric not found", { id });
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;
    metric.status = status;
    metric.metadata = { ...metric.metadata, ...additionalMetadata };

    // Check for performance alerts
    this.checkPerformanceAlerts(metric);

    // Log performance metric
    this.logPerformanceMetric(metric);

    // Update aggregated metrics
    this.updateAggregatedMetrics(metric);

    // Clean up
    this.metrics.delete(id);
  }

  /**
   * Track API performance
   */
  async trackAPI<T>(
    endpoint: string,
    method: string,
    operation: () => Promise<T>,
    context?: {
      userId?: string;
      sessionId?: string;
      ipAddress?: string;
    },
  ): Promise<T> {
    const id = this.startTiming(`API: ${method} ${endpoint}`, "api", {
      endpoint,
      method,
      ...context,
    });

    try {
      const result = await operation();

      this.endTiming(id, "completed", {
        statusCode: 200, // Assume success if no error
      });

      return result;
    } catch (error) {
      const statusCode =
        error instanceof Error && "statusCode" in error
          ? (error as any).statusCode
          : 500;

      this.endTiming(id, "failed", {
        statusCode,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Track database performance
   */
  async trackDatabase<T>(
    query: string,
    table: string,
    operation: DatabaseMetric["operation"],
    dbOperation: () => Promise<T>,
  ): Promise<T> {
    const id = this.startTiming(`DB: ${operation} ${table}`, "database", {
      query: this.sanitizeQuery(query),
      table,
      operation,
    });

    try {
      const result = await dbOperation();

      // Try to extract rows affected (if applicable)
      let rowsAffected: number | undefined;
      if (Array.isArray(result)) {
        rowsAffected = result.length;
      } else if (result && typeof result === "object" && "rowCount" in result) {
        rowsAffected = (result as any).rowCount;
      }

      this.endTiming(id, "completed", {
        rowsAffected,
      });

      return result;
    } catch (error) {
      this.endTiming(id, "failed", {
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Track external service performance
   */
  async trackExternalService<T>(
    service: ExternalServiceMetric["service"],
    operation: string,
    serviceCall: () => Promise<T>,
    retryCount: number = 0,
  ): Promise<T> {
    const id = this.startTiming(
      `Service: ${service} ${operation}`,
      "external_service",
      {
        service,
        operation,
        retryCount,
      },
    );

    try {
      const result = await serviceCall();

      this.endTiming(id, "completed", {
        statusCode: 200, // Assume success
      });

      return result;
    } catch (error) {
      const statusCode =
        error instanceof Error && "statusCode" in error
          ? (error as any).statusCode
          : 500;

      this.endTiming(id, "failed", {
        statusCode,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Record system metric
   */
  recordSystemMetric(
    metric: SystemMetric["metric"],
    value: number,
    unit: string,
    threshold?: number,
  ): void {
    const systemMetric: SystemMetric = {
      id: nanoid(),
      name: `System: ${metric}`,
      type: "system",
      startTime: performance.now(),
      endTime: performance.now(),
      duration: 0,
      status: "completed",
      metric,
      value,
      unit,
      threshold,
    };

    // Check for system alerts
    if (threshold && value > threshold) {
      this.sendSystemAlert(systemMetric);
    }

    this.logPerformanceMetric(systemMetric);
    this.updateAggregatedMetrics(systemMetric);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeWindow: number = 3600000): {
    // 1 hour default
    api: any;
    database: any;
    externalServices: any;
    system: any;
  } {
    const now = Date.now();
    const cutoff = now - timeWindow;

    const summary = {
      api: this.getAPIMetricsSummary(cutoff),
      database: this.getDatabaseMetricsSummary(cutoff),
      externalServices: this.getExternalServiceMetricsSummary(cutoff),
      system: this.getSystemMetricsSummary(cutoff),
    };

    return summary;
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(metric: PerformanceMetric): void {
    if (!metric.duration) return;

    let threshold: number | undefined;
    let alertType: string | undefined;

    switch (metric.type) {
      case "api":
        threshold = this.alertThresholds.api_response_time;
        alertType = "Slow API Response";
        break;
      case "database":
        threshold = this.alertThresholds.database_query_time;
        alertType = "Slow Database Query";
        break;
      case "external_service":
        threshold = this.alertThresholds.external_service_time;
        alertType = "Slow External Service";
        break;
    }

    if (threshold && metric.duration > threshold) {
      this.sendPerformanceAlert(metric, alertType!, threshold);
    }
  }

  /**
   * Send performance alert
   */
  private async sendPerformanceAlert(
    metric: PerformanceMetric,
    alertType: string,
    threshold: number,
  ): Promise<void> {
    const alertData = {
      type: alertType,
      metric: metric.name,
      duration: metric.duration,
      threshold,
      metadata: metric.metadata,
      timestamp: new Date().toISOString(),
    };

    logger.warn("Performance Alert", alertData);

    await auditLogger.logEvent({
      action: "performance_alert",
      details: alertData,
      severity: "medium",
      category: "system",
      outcome: "warning",
    });
  }

  /**
   * Send system alert
   */
  private async sendSystemAlert(metric: SystemMetric): Promise<void> {
    const alertData = {
      type: "System Resource Alert",
      metric: metric.metric,
      value: metric.value,
      unit: metric.unit,
      threshold: metric.threshold,
      timestamp: new Date().toISOString(),
    };

    logger.error("System Alert", alertData);

    await auditLogger.logEvent({
      action: "system_resource_alert",
      details: alertData,
      severity: "high",
      category: "system",
      outcome: "warning",
    });
  }

  /**
   * Log performance metric
   */
  private logPerformanceMetric(metric: PerformanceMetric): void {
    const logData = {
      id: metric.id,
      name: metric.name,
      type: metric.type,
      duration: metric.duration,
      status: metric.status,
      metadata: metric.metadata,
    };

    if (metric.status === "failed") {
      logger.warn("Performance metric failed", logData);
    } else if (metric.duration && metric.duration > 1000) {
      logger.warn("Slow performance detected", logData);
    } else {
      logger.debug("Performance metric recorded", logData);
    }
  }

  /**
   * Update aggregated metrics
   */
  private updateAggregatedMetrics(metric: PerformanceMetric): void {
    const key = `${metric.type}:${metric.name}`;
    const existing = this.aggregatedMetrics.get(key) || {
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      successCount: 0,
      failureCount: 0,
    };

    existing.count++;
    if (metric.duration) {
      existing.totalDuration += metric.duration;
      existing.avgDuration = existing.totalDuration / existing.count;
      existing.minDuration = Math.min(existing.minDuration, metric.duration);
      existing.maxDuration = Math.max(existing.maxDuration, metric.duration);
    }

    if (metric.status === "completed") {
      existing.successCount++;
    } else if (metric.status === "failed") {
      existing.failureCount++;
    }

    this.aggregatedMetrics.set(key, existing);
  }

  /**
   * Sanitize database query for logging
   */
  private sanitizeQuery(query: string): string {
    // Remove potential sensitive data from queries
    return query
      .replace(/VALUES\s*\([^)]+\)/gi, "VALUES (...)")
      .replace(/=\s*'[^']*'/gi, "= '***'")
      .replace(/=\s*"[^"]*"/gi, '= "***"')
      .substring(0, 200); // Limit length
  }

  /**
   * Start system metrics collection
   */
  private startSystemMetricsCollection(): void {
    setInterval(() => {
      try {
        // Memory usage
        const memUsage = process.memoryUsage();
        const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        this.recordSystemMetric(
          "memory",
          memUsagePercent,
          "%",
          this.alertThresholds.memory_usage,
        );

        // CPU usage (simplified - in production, use proper CPU monitoring)
        const cpuUsage = process.cpuUsage();
        const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
        this.recordSystemMetric(
          "cpu",
          cpuPercent,
          "seconds",
          this.alertThresholds.cpu_usage,
        );
      } catch (error) {
        logger.error("Failed to collect system metrics", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, 60000); // Every minute
  }

  /**
   * Start metrics aggregation
   */
  private startMetricsAggregation(): void {
    setInterval(() => {
      // Log aggregated metrics summary
      const summary = this.getPerformanceSummary();
      logger.info("Performance Summary", summary);
    }, 300000); // Every 5 minutes
  }

  /**
   * Get API metrics summary
   */
  private getAPIMetricsSummary(cutoff: number): any {
    // Implementation would aggregate API metrics
    return {
      totalRequests: 0,
      avgResponseTime: 0,
      errorRate: 0,
      slowRequests: 0,
    };
  }

  /**
   * Get database metrics summary
   */
  private getDatabaseMetricsSummary(cutoff: number): any {
    return {
      totalQueries: 0,
      avgQueryTime: 0,
      slowQueries: 0,
      failedQueries: 0,
    };
  }

  /**
   * Get external service metrics summary
   */
  private getExternalServiceMetricsSummary(cutoff: number): any {
    return {
      totalCalls: 0,
      avgResponseTime: 0,
      errorRate: 0,
      serviceStatus: {},
    };
  }

  /**
   * Get system metrics summary
   */
  private getSystemMetricsSummary(cutoff: number): any {
    return {
      memoryUsage: 0,
      cpuUsage: 0,
      diskUsage: 0,
      networkIO: 0,
    };
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility functions
export const trackAPICall = <T>(
  endpoint: string,
  method: string,
  operation: () => Promise<T>,
  context?: { userId?: string; sessionId?: string; ipAddress?: string },
): Promise<T> =>
  performanceMonitor.trackAPI(endpoint, method, operation, context);

export const trackDatabaseQuery = <T>(
  query: string,
  table: string,
  operation: DatabaseMetric["operation"],
  dbOperation: () => Promise<T>,
): Promise<T> =>
  performanceMonitor.trackDatabase(query, table, operation, dbOperation);

export const trackExternalServiceCall = <T>(
  service: ExternalServiceMetric["service"],
  operation: string,
  serviceCall: () => Promise<T>,
  retryCount?: number,
): Promise<T> =>
  performanceMonitor.trackExternalService(
    service,
    operation,
    serviceCall,
    retryCount,
  );
