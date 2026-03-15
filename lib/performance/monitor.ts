import React from "react";

// Performance monitoring utilities for React components

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();

  // Track component render times
  trackRender(
    componentName: string,
    renderTime: number,
    metadata?: Record<string, unknown>,
  ) {
    this.addMetric({
      name: `render.${componentName}`,
      value: renderTime,
      timestamp: Date.now(),
      metadata,
    });

    // Warn about slow renders in development
    if (process.env.NODE_ENV === "development" && renderTime > 16) {
      // Slow render detected - logged to performance monitor
    }
  }

  // Track API call performance
  trackApiCall(
    endpoint: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, unknown>,
  ) {
    this.addMetric({
      name: `api.${endpoint.replace(/[^a-zA-Z0-9]/g, "_")}`,
      value: duration,
      timestamp: Date.now(),
      metadata: {
        success,
        ...metadata,
      },
    });
  }

  // Track user interactions
  trackInteraction(
    action: string,
    duration?: number,
    metadata?: Record<string, unknown>,
  ) {
    this.addMetric({
      name: `interaction.${action}`,
      value: duration || 0,
      timestamp: Date.now(),
      metadata,
    });
  }

  // Track memory usage
  trackMemoryUsage() {
    if ("memory" in performance) {
      const memory = (
        performance as unknown as {
          memory: {
            usedJSHeapSize: number;
            totalJSHeapSize: number;
            jsHeapSizeLimit: number;
          };
        }
      ).memory;
      this.addMetric({
        name: "memory.used",
        value: memory.usedJSHeapSize,
        timestamp: Date.now(),
        metadata: {
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        },
      });
    }
  }

  // Start observing Core Web Vitals
  observeWebVitals() {
    if (typeof window === "undefined") return;

    // Largest Contentful Paint (LCP)
    this.observePerformanceEntry("largest-contentful-paint", (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.addMetric({
        name: "web_vitals.lcp",
        value: lastEntry.startTime,
        timestamp: Date.now(),
      });
    });

    // First Input Delay (FID)
    this.observePerformanceEntry("first-input", (entries) => {
      entries.forEach((entry) => {
        const fidEntry = entry as unknown as {
          processingStart: number;
          startTime: number;
        };
        this.addMetric({
          name: "web_vitals.fid",
          value: fidEntry.processingStart - fidEntry.startTime,
          timestamp: Date.now(),
        });
      });
    });

    // Cumulative Layout Shift (CLS)
    this.observePerformanceEntry("layout-shift", (entries) => {
      let clsValue = 0;
      entries.forEach((entry) => {
        if (!(entry as unknown as { hadRecentInput: boolean }).hadRecentInput) {
          clsValue += (entry as unknown as { value: number }).value;
        }
      });

      if (clsValue > 0) {
        this.addMetric({
          name: "web_vitals.cls",
          value: clsValue,
          timestamp: Date.now(),
        });
      }
    });
  }

  // Observe specific performance entries
  private observePerformanceEntry(
    entryType: string,
    callback: (entries: PerformanceEntry[]) => void,
  ) {
    if (typeof window === "undefined" || !("PerformanceObserver" in window))
      return;

    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });

      observer.observe({ entryTypes: [entryType] });
      this.observers.set(entryType, observer);
    } catch (error) {
      // Failed to observe performance entry type
    }
  }

  // Add metric to collection
  private addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Send to analytics service in production
    if (process.env.NODE_ENV === "production") {
      this.sendToAnalytics(metric);
    }
  }

  // Send metrics to analytics service
  private sendToAnalytics(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _metric: PerformanceMetric,
  ) {
    // Implement your analytics service integration here
    // Example: Google Analytics, DataDog, New Relic, etc.

    // For now, just track in development
    if (process.env.NODE_ENV === "development") {
      // Performance metric tracked internally
    }
  }

  // Get performance summary
  getMetricsSummary(timeWindow = 5 * 60 * 1000) {
    // Last 5 minutes
    const now = Date.now();
    const recentMetrics = this.metrics.filter(
      (metric) => now - metric.timestamp <= timeWindow,
    );

    const summary: Record<
      string,
      { count: number; avg: number; max: number; min: number }
    > = {};

    recentMetrics.forEach((metric) => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          avg: 0,
          max: -Infinity,
          min: Infinity,
        };
      }

      const stat = summary[metric.name];
      stat.count++;
      stat.max = Math.max(stat.max, metric.value);
      stat.min = Math.min(stat.min, metric.value);
      stat.avg = (stat.avg * (stat.count - 1) + metric.value) / stat.count;
    });

    return summary;
  }

  // Clear all metrics
  clear() {
    this.metrics = [];
  }

  // Disconnect all observers
  disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Initialize web vitals observation
if (typeof window !== "undefined") {
  performanceMonitor.observeWebVitals();
}

// React hook for component performance tracking
export function usePerformanceTracking(componentName: string) {
  const startTime = performance.now();

  React.useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    performanceMonitor.trackRender(componentName, renderTime);
  });

  return {
    trackInteraction: (action: string, metadata?: Record<string, unknown>) => {
      performanceMonitor.trackInteraction(
        `${componentName}.${action}`,
        undefined,
        metadata,
      );
    },
  };
}

// Higher-order component for automatic performance tracking
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string,
) {
  const name =
    componentName || Component.displayName || Component.name || "Unknown";

  return React.memo(function PerformanceTrackedComponent(props: P) {
    usePerformanceTracking(name);
    return React.createElement(Component, props);
  });
}

// API call performance tracker
export async function trackApiCall<T>(
  endpoint: string,
  apiCall: () => Promise<T>,
  metadata?: Record<string, unknown>,
): Promise<T> {
  const startTime = performance.now();
  let success = false;

  try {
    const result = await apiCall();
    success = true;
    return result;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const duration = performance.now() - startTime;
    performanceMonitor.trackApiCall(endpoint, duration, success, metadata);
  }
}
