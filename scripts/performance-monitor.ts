#!/usr/bin/env tsx

/**
 * Performance monitoring script for frontend components
 */

import { performanceMonitor } from "../lib/performance/monitor";

async function runPerformanceTests() {
  console.log("🚀 Frontend Performance Monitor");
  console.log("================================\n");

  // Simulate component render tracking
  console.log("📊 Simulating component performance tracking...");

  // Mock some performance data
  performanceMonitor.trackRender("SupportTicketManagement", 12.5, {
    itemCount: 50,
    filterActive: true,
  });

  performanceMonitor.trackRender("UserManagement", 8.2, {
    itemCount: 100,
    viewMode: "table",
  });

  performanceMonitor.trackRender("AdminDashboard", 15.8, {
    chartsLoaded: true,
    metricsCount: 8,
  });

  // Mock API call tracking
  console.log("🌐 Simulating API call performance...");

  performanceMonitor.trackApiCall("/api/admin/support/tickets", 245, true, {
    cacheHit: false,
    itemCount: 50,
  });

  performanceMonitor.trackApiCall("/api/admin/users", 180, true, {
    cacheHit: true,
    itemCount: 100,
  });

  performanceMonitor.trackApiCall("/api/admin/dashboard/metrics", 320, false, {
    error: "timeout",
  });

  // Mock user interactions
  console.log("👆 Simulating user interactions...");

  performanceMonitor.trackInteraction("ticket_filter_change", 5, {
    filterType: "status",
    resultCount: 25,
  });

  performanceMonitor.trackInteraction("user_search", 150, {
    searchTerm: "john",
    resultCount: 12,
  });

  performanceMonitor.trackInteraction("pagination_click", 2, {
    page: 3,
    totalPages: 10,
  });

  // Track memory usage
  performanceMonitor.trackMemoryUsage();

  // Wait a bit for metrics to accumulate
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Get performance summary
  console.log("\n📈 Performance Summary (Last 5 minutes):");
  console.log("==========================================");

  const summary = performanceMonitor.getMetricsSummary();

  Object.entries(summary).forEach(([metricName, stats]) => {
    const status = getPerformanceStatus(metricName, stats.avg);
    console.log(`${status} ${metricName}:`);
    console.log(`   Average: ${stats.avg.toFixed(2)}ms`);
    console.log(`   Min: ${stats.min.toFixed(2)}ms`);
    console.log(`   Max: ${stats.max.toFixed(2)}ms`);
    console.log(`   Count: ${stats.count}`);
    console.log("");
  });

  // Performance recommendations
  console.log("💡 Performance Recommendations:");
  console.log("===============================");

  const recommendations = generateRecommendations(summary);
  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });

  console.log("\n✅ Performance monitoring complete!");
  console.log("\n📋 Next Steps:");
  console.log("- Review component render times");
  console.log("- Optimize slow API calls");
  console.log("- Implement caching for frequently accessed data");
  console.log("- Monitor Core Web Vitals in production");
}

function getPerformanceStatus(metricName: string, avgValue: number): string {
  if (metricName.startsWith("render.")) {
    if (avgValue < 10) return "🟢";
    if (avgValue < 16) return "🟡";
    return "🔴";
  }

  if (metricName.startsWith("api.")) {
    if (avgValue < 200) return "🟢";
    if (avgValue < 500) return "🟡";
    return "🔴";
  }

  if (metricName.startsWith("interaction.")) {
    if (avgValue < 100) return "🟢";
    if (avgValue < 300) return "🟡";
    return "🔴";
  }

  return "ℹ️";
}

function generateRecommendations(summary: Record<string, any>): string[] {
  const recommendations: string[] = [];

  Object.entries(summary).forEach(([metricName, stats]) => {
    if (metricName.startsWith("render.") && stats.avg > 16) {
      recommendations.push(
        `Optimize ${metricName.replace("render.", "")} component - render time is ${stats.avg.toFixed(1)}ms (target: <16ms)`,
      );
    }

    if (metricName.startsWith("api.") && stats.avg > 500) {
      recommendations.push(
        `Optimize ${metricName.replace("api.", "")} API call - response time is ${stats.avg.toFixed(1)}ms (target: <500ms)`,
      );
    }

    if (metricName.startsWith("interaction.") && stats.avg > 300) {
      recommendations.push(
        `Improve ${metricName.replace("interaction.", "")} interaction responsiveness - current: ${stats.avg.toFixed(1)}ms (target: <100ms)`,
      );
    }
  });

  if (recommendations.length === 0) {
    recommendations.push(
      "All performance metrics are within acceptable ranges! 🎉",
    );
    recommendations.push(
      "Consider implementing virtual scrolling for large lists",
    );
    recommendations.push(
      "Add performance monitoring to production environment",
    );
    recommendations.push("Set up Core Web Vitals tracking");
  }

  return recommendations;
}

// Run the performance tests
runPerformanceTests().catch(console.error);
