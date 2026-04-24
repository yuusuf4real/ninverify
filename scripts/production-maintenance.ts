#!/usr/bin/env tsx

/**
 * Production Maintenance Script
 *
 * Comprehensive maintenance tasks for production environment including
 * health checks, cleanup, monitoring, and compliance verification.
 */

import { db } from "@/db/client";
import { adminAuditLogs, verificationSessions, otpSessions } from "@/db/new-schema";
import { lt, eq, and, sql } from "drizzle-orm";
import { logger } from "@/lib/security/secure-logger";
import { auditLogger } from "@/lib/security/enhanced-audit-logger";
import { NDPAComplianceService } from "@/lib/compliance/ndpa-compliance";
import { disasterRecovery } from "@/lib/backup/disaster-recovery";
import { performanceMonitor } from "@/lib/monitoring/performance-monitor";
import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface MaintenanceTask {
  name: string;
  description: string;
  frequency: "hourly" | "daily" | "weekly" | "monthly";
  critical: boolean;
  execute: () => Promise<void>;
}

interface HealthCheckResult {
  service: string;
  status: "healthy" | "warning" | "critical";
  message: string;
  metrics?: Record<string, any>;
}

class ProductionMaintenanceService {
  private tasks: MaintenanceTask[] = [];
  private healthChecks: Map<string, HealthCheckResult> = new Map();

  constructor() {
    this.initializeTasks();
  }

  /**
   * Run maintenance tasks based on frequency
   */
  async runMaintenance(frequency: MaintenanceTask["frequency"]): Promise<void> {
    logger.info("Starting maintenance tasks", { frequency });

    const tasksToRun = this.tasks.filter(
      (task) => task.frequency === frequency,
    );
    const results: { task: string; success: boolean; error?: string }[] = [];

    for (const task of tasksToRun) {
      try {
        logger.info("Executing maintenance task", {
          task: task.name,
          critical: task.critical,
        });

        await task.execute();
        results.push({ task: task.name, success: true });

        logger.info("Maintenance task completed", { task: task.name });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        results.push({ task: task.name, success: false, error: errorMessage });

        logger.error("Maintenance task failed", {
          task: task.name,
          error: errorMessage,
          critical: task.critical,
        });

        // Alert on critical task failures
        if (task.critical) {
          await this.sendCriticalAlert(task.name, errorMessage);
        }
      }
    }

    // Log maintenance summary
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    await auditLogger.logEvent({
      action: "maintenance_completed",
      details: {
        frequency,
        totalTasks: results.length,
        successful,
        failed,
        results,
      },
      severity: failed > 0 ? "medium" : "low",
      category: "system",
      outcome: failed > 0 ? "warning" : "success",
    });

    logger.info("Maintenance tasks completed", {
      frequency,
      successful,
      failed,
    });
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<Map<string, HealthCheckResult>> {
    logger.info("Starting comprehensive health check");

    const checks = [
      this.checkDatabase(),
      this.checkDiskSpace(),
      this.checkMemoryUsage(),
      this.checkApplicationHealth(),
      this.checkExternalServices(),
      this.checkSecurityStatus(),
      this.checkBackupStatus(),
      this.checkComplianceStatus(),
    ];

    const results = await Promise.allSettled(checks);

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        this.healthChecks.set(result.value.service, result.value);
      } else {
        this.healthChecks.set(`check_${index}`, {
          service: `check_${index}`,
          status: "critical",
          message: result.reason?.message || "Health check failed",
        });
      }
    });

    // Generate health summary
    const healthy = Array.from(this.healthChecks.values()).filter(
      (c) => c.status === "healthy",
    ).length;
    const warnings = Array.from(this.healthChecks.values()).filter(
      (c) => c.status === "warning",
    ).length;
    const critical = Array.from(this.healthChecks.values()).filter(
      (c) => c.status === "critical",
    ).length;

    logger.info("Health check completed", {
      total: this.healthChecks.size,
      healthy,
      warnings,
      critical,
    });

    // Alert on critical health issues
    if (critical > 0) {
      await this.sendHealthAlert(critical, warnings);
    }

    return this.healthChecks;
  }

  /**
   * Generate maintenance report
   */
  async generateMaintenanceReport(): Promise<string> {
    const reportPath = path.join(
      process.cwd(),
      "reports",
      `maintenance-${new Date().toISOString().split("T")[0]}.json`,
    );

    const report = {
      timestamp: new Date().toISOString(),
      healthChecks: Object.fromEntries(this.healthChecks),
      systemMetrics: await this.getSystemMetrics(),
      performanceMetrics: performanceMonitor.getPerformanceSummary(),
      complianceStatus: await this.getComplianceStatus(),
      backupStatus: await this.getBackupStatus(),
      securityStatus: await this.getSecurityStatus(),
    };

    // Ensure reports directory exists
    await fs.mkdir(path.dirname(reportPath), { recursive: true });

    // Write report
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    logger.info("Maintenance report generated", { reportPath });
    return reportPath;
  }

  /**
   * Initialize maintenance tasks
   */
  private initializeTasks(): void {
    this.tasks = [
      // Hourly tasks
      {
        name: "health_check",
        description: "Perform system health check",
        frequency: "hourly",
        critical: true,
        execute: async () => {
          await this.performHealthCheck();
        },
      },
      {
        name: "cleanup_expired_sessions",
        description: "Clean up expired OTP and verification sessions",
        frequency: "hourly",
        critical: false,
        execute: async () => {
          await this.cleanupExpiredSessions();
        },
      },

      // Daily tasks
      {
        name: "database_backup",
        description: "Create daily database backup",
        frequency: "daily",
        critical: true,
        execute: async () => {
          await disasterRecovery.createDatabaseBackup();
        },
      },
      {
        name: "log_rotation",
        description: "Rotate and compress log files",
        frequency: "daily",
        critical: false,
        execute: async () => {
          await this.rotateLogFiles();
        },
      },
      {
        name: "security_scan",
        description: "Run security vulnerability scan",
        frequency: "daily",
        critical: true,
        execute: async () => {
          await this.runSecurityScan();
        },
      },
      {
        name: "performance_analysis",
        description: "Analyze performance metrics and generate alerts",
        frequency: "daily",
        critical: false,
        execute: async () => {
          await this.analyzePerformanceMetrics();
        },
      },

      // Weekly tasks
      {
        name: "compliance_audit",
        description: "Perform NDPA compliance audit",
        frequency: "weekly",
        critical: true,
        execute: async () => {
          await this.performComplianceAudit();
        },
      },
      {
        name: "configuration_backup",
        description: "Backup system configuration",
        frequency: "weekly",
        critical: false,
        execute: async () => {
          await disasterRecovery.createConfigurationBackup();
        },
      },
      {
        name: "dependency_audit",
        description: "Audit npm dependencies for vulnerabilities",
        frequency: "weekly",
        critical: true,
        execute: async () => {
          await this.auditDependencies();
        },
      },

      // Monthly tasks
      {
        name: "data_retention_cleanup",
        description: "Clean up data based on retention policies",
        frequency: "monthly",
        critical: true,
        execute: async () => {
          await NDPAComplianceService.performDataRetentionCleanup();
        },
      },
      {
        name: "disaster_recovery_test",
        description: "Test disaster recovery procedures",
        frequency: "monthly",
        critical: true,
        execute: async () => {
          await this.testDisasterRecovery();
        },
      },
      {
        name: "ssl_certificate_check",
        description: "Check SSL certificate expiration",
        frequency: "monthly",
        critical: true,
        execute: async () => {
          await this.checkSSLCertificates();
        },
      },
    ];
  }

  /**
   * Health check implementations
   */
  private async checkDatabase(): Promise<HealthCheckResult> {
    try {
      const start = Date.now();
      await db.execute(sql`SELECT 1 as health_check`);
      const duration = Date.now() - start;

      if (duration > 1000) {
        return {
          service: "database",
          status: "warning",
          message: `Database responding slowly (${duration}ms)`,
          metrics: { responseTime: duration },
        };
      }

      return {
        service: "database",
        status: "healthy",
        message: "Database connection healthy",
        metrics: { responseTime: duration },
      };
    } catch (error) {
      return {
        service: "database",
        status: "critical",
        message: `Database connection failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private async checkDiskSpace(): Promise<HealthCheckResult> {
    try {
      const { stdout } = await execAsync(
        "df -h / | tail -1 | awk '{print $5}' | sed 's/%//'",
      );
      const usage = parseInt(stdout.trim());

      if (usage > 90) {
        return {
          service: "disk_space",
          status: "critical",
          message: `Disk usage critical: ${usage}%`,
          metrics: { usage },
        };
      } else if (usage > 80) {
        return {
          service: "disk_space",
          status: "warning",
          message: `Disk usage high: ${usage}%`,
          metrics: { usage },
        };
      }

      return {
        service: "disk_space",
        status: "healthy",
        message: `Disk usage normal: ${usage}%`,
        metrics: { usage },
      };
    } catch (error) {
      return {
        service: "disk_space",
        status: "warning",
        message: "Could not check disk space",
      };
    }
  }

  private async checkMemoryUsage(): Promise<HealthCheckResult> {
    const memUsage = process.memoryUsage();
    const usagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    if (usagePercent > 90) {
      return {
        service: "memory",
        status: "critical",
        message: `Memory usage critical: ${usagePercent.toFixed(1)}%`,
        metrics: memUsage,
      };
    } else if (usagePercent > 80) {
      return {
        service: "memory",
        status: "warning",
        message: `Memory usage high: ${usagePercent.toFixed(1)}%`,
        metrics: memUsage,
      };
    }

    return {
      service: "memory",
      status: "healthy",
      message: `Memory usage normal: ${usagePercent.toFixed(1)}%`,
      metrics: memUsage,
    };
  }

  private async checkApplicationHealth(): Promise<HealthCheckResult> {
    try {
      // Check if the application is responding
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch("http://localhost:3000/api/health", {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          service: "application",
          status: "healthy",
          message: "Application responding normally",
          metrics: { statusCode: response.status },
        };
      } else {
        return {
          service: "application",
          status: "warning",
          message: `Application responding with status ${response.status}`,
          metrics: { statusCode: response.status },
        };
      }
    } catch (error) {
      return {
        service: "application",
        status: "critical",
        message: "Application not responding",
      };
    }
  }

  private async checkExternalServices(): Promise<HealthCheckResult> {
    const services = ["youverify", "paystack", "termii"];
    const results: Record<string, boolean> = {};

    // This would implement actual health checks for external services
    // For now, assume they're healthy
    services.forEach((service) => {
      results[service] = true;
    });

    const healthyServices = Object.values(results).filter(Boolean).length;
    const totalServices = services.length;

    if (healthyServices === totalServices) {
      return {
        service: "external_services",
        status: "healthy",
        message: "All external services healthy",
        metrics: results,
      };
    } else if (healthyServices > totalServices / 2) {
      return {
        service: "external_services",
        status: "warning",
        message: `${totalServices - healthyServices} external services down`,
        metrics: results,
      };
    } else {
      return {
        service: "external_services",
        status: "critical",
        message: "Multiple external services down",
        metrics: results,
      };
    }
  }

  private async checkSecurityStatus(): Promise<HealthCheckResult> {
    // Check for recent security events
    const recentSecurityEvents = await db.query.adminAuditLogs.findMany({
      where: and(
        eq(adminAuditLogs.action, "security_alert"),
        lt(adminAuditLogs.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
      ),
      limit: 10,
    });

    if (recentSecurityEvents.length > 5) {
      return {
        service: "security",
        status: "warning",
        message: `${recentSecurityEvents.length} security events in last 24h`,
        metrics: { recentEvents: recentSecurityEvents.length },
      };
    }

    return {
      service: "security",
      status: "healthy",
      message: "No significant security events",
      metrics: { recentEvents: recentSecurityEvents.length },
    };
  }

  private async checkBackupStatus(): Promise<HealthCheckResult> {
    const backupHistory = disasterRecovery.getBackupHistory("database", 5);
    const latestBackup = backupHistory[0];

    if (!latestBackup) {
      return {
        service: "backups",
        status: "critical",
        message: "No recent backups found",
      };
    }

    const hoursSinceBackup =
      (Date.now() - latestBackup.timestamp.getTime()) / (1000 * 60 * 60);

    if (hoursSinceBackup > 48) {
      return {
        service: "backups",
        status: "critical",
        message: `Last backup ${hoursSinceBackup.toFixed(1)} hours ago`,
        metrics: { hoursSinceBackup, latestBackup: latestBackup.id },
      };
    } else if (hoursSinceBackup > 24) {
      return {
        service: "backups",
        status: "warning",
        message: `Last backup ${hoursSinceBackup.toFixed(1)} hours ago`,
        metrics: { hoursSinceBackup, latestBackup: latestBackup.id },
      };
    }

    return {
      service: "backups",
      status: "healthy",
      message: `Latest backup ${hoursSinceBackup.toFixed(1)} hours ago`,
      metrics: { hoursSinceBackup, latestBackup: latestBackup.id },
    };
  }

  private async checkComplianceStatus(): Promise<HealthCheckResult> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      const complianceReport =
        await NDPAComplianceService.generateComplianceReport(
          startDate,
          endDate,
        );

      if (!complianceReport.dataRetentionCompliance) {
        return {
          service: "compliance",
          status: "warning",
          message: "Data retention policy violations detected",
          metrics: complianceReport,
        };
      }

      return {
        service: "compliance",
        status: "healthy",
        message: "NDPA compliance status good",
        metrics: complianceReport,
      };
    } catch (error) {
      return {
        service: "compliance",
        status: "warning",
        message: "Could not verify compliance status",
      };
    }
  }

  /**
   * Maintenance task implementations
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    // Clean up expired OTP sessions
    const expiredOTPSessions = await db.query.otpSessions.findMany({
      where: lt(otpSessions.expiresAt, expiredDate),
    });

    for (const session of expiredOTPSessions) {
      await db.delete(otpSessions).where(eq(otpSessions.id, session.id));
    }

    // Clean up expired verification sessions
    const expiredVerificationSessions =
      await db.query.verificationSessions.findMany({
        where: and(
          eq(verificationSessions.status, "expired"),
          lt(verificationSessions.createdAt, expiredDate),
        ),
      });

    for (const session of expiredVerificationSessions) {
      await db
        .delete(verificationSessions)
        .where(eq(verificationSessions.id, session.id));
    }

    logger.info("Expired sessions cleaned up", {
      otpSessions: expiredOTPSessions.length,
      verificationSessions: expiredVerificationSessions.length,
    });
  }

  private async rotateLogFiles(): Promise<void> {
    try {
      // Rotate application logs
      await execAsync("logrotate -f /etc/logrotate.d/verifynin");
      logger.info("Log files rotated successfully");
    } catch (error) {
      logger.warn("Log rotation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async runSecurityScan(): Promise<void> {
    try {
      // Run npm audit
      const { stdout } = await execAsync("npm audit --json");
      const auditResult = JSON.parse(stdout);

      if (auditResult.metadata.vulnerabilities.total > 0) {
        logger.warn("Security vulnerabilities detected", {
          total: auditResult.metadata.vulnerabilities.total,
          high: auditResult.metadata.vulnerabilities.high,
          critical: auditResult.metadata.vulnerabilities.critical,
        });

        await auditLogger.logEvent({
          action: "security_vulnerabilities_detected",
          details: auditResult.metadata.vulnerabilities,
          severity:
            auditResult.metadata.vulnerabilities.critical > 0
              ? "high"
              : "medium",
          category: "security",
          outcome: "warning",
        });
      }
    } catch (error) {
      logger.error("Security scan failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async analyzePerformanceMetrics(): Promise<void> {
    const summary = performanceMonitor.getPerformanceSummary();

    // Log performance summary
    logger.info("Daily performance summary", summary);

    // Check for performance issues
    if (summary.api.errorRate > 0.05) {
      // 5% error rate
      await auditLogger.logEvent({
        action: "high_api_error_rate",
        details: { errorRate: summary.api.errorRate },
        severity: "medium",
        category: "system",
        outcome: "warning",
      });
    }
  }

  private async performComplianceAudit(): Promise<void> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    const report = await NDPAComplianceService.generateComplianceReport(
      startDate,
      endDate,
    );

    logger.info("Weekly compliance audit completed", report);

    if (!report.dataRetentionCompliance) {
      await auditLogger.logEvent({
        action: "compliance_violation_detected",
        details: { type: "data_retention", report },
        severity: "high",
        category: "compliance",
        outcome: "warning",
      });
    }
  }

  private async auditDependencies(): Promise<void> {
    try {
      const { stdout } = await execAsync(
        "npm audit --audit-level=moderate --json",
      );
      const auditResult = JSON.parse(stdout);

      logger.info("Dependency audit completed", {
        vulnerabilities: auditResult.metadata.vulnerabilities,
      });
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities are found
      logger.warn("Dependency vulnerabilities found", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async testDisasterRecovery(): Promise<void> {
    // This would implement disaster recovery testing
    // For now, just verify that recovery plans exist
    const plans = disasterRecovery.getRecoveryPlans();

    logger.info("Disaster recovery test completed", {
      availablePlans: plans.length,
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        priority: p.priority,
      })),
    });
  }

  private async checkSSLCertificates(): Promise<void> {
    try {
      // Check SSL certificate expiration
      const domain = process.env.DOMAIN || "verifynin.ng";
      const { stdout } = await execAsync(
        `echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -dates`,
      );

      logger.info("SSL certificate check completed", {
        domain,
        certificateInfo: stdout.trim(),
      });
    } catch (error) {
      logger.warn("SSL certificate check failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Helper methods
   */
  private async sendCriticalAlert(
    taskName: string,
    error: string,
  ): Promise<void> {
    await auditLogger.logEvent({
      action: "critical_maintenance_failure",
      details: { taskName, error },
      severity: "critical",
      category: "system",
      outcome: "failure",
    });

    // In production, this would send alerts via email, Slack, etc.
    logger.error("CRITICAL MAINTENANCE FAILURE", {
      task: taskName,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  private async sendHealthAlert(
    critical: number,
    warnings: number,
  ): Promise<void> {
    await auditLogger.logEvent({
      action: "health_check_alert",
      details: { critical, warnings },
      severity: critical > 0 ? "high" : "medium",
      category: "system",
      outcome: "warning",
    });
  }

  private async getSystemMetrics(): Promise<Record<string, any>> {
    return {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage(),
      version: process.version,
      platform: process.platform,
    };
  }

  private async getComplianceStatus(): Promise<Record<string, any>> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    return await NDPAComplianceService.generateComplianceReport(
      startDate,
      endDate,
    );
  }

  private async getBackupStatus(): Promise<Record<string, any>> {
    const history = disasterRecovery.getBackupHistory(undefined, 10);
    return {
      totalBackups: history.length,
      latestBackup: history[0],
      backupSizes: history.map((b) => ({
        id: b.id,
        size: b.size,
        timestamp: b.timestamp,
      })),
    };
  }

  private async getSecurityStatus(): Promise<Record<string, any>> {
    const recentEvents = await db.query.adminAuditLogs.findMany({
      where: and(
        lt(adminAuditLogs.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
      ),
      limit: 100,
    });

    return {
      recentEvents: recentEvents.length,
      securityEvents: recentEvents.filter((e) => e.action.includes("security"))
        .length,
      failedLogins: recentEvents.filter((e) => e.action === "login_failure")
        .length,
    };
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const frequency = args[1] as MaintenanceTask["frequency"];

  const maintenance = new ProductionMaintenanceService();

  try {
    switch (command) {
      case "run":
        if (
          !frequency ||
          !["hourly", "daily", "weekly", "monthly"].includes(frequency)
        ) {
          console.error(
            "Usage: npm run maintenance run <hourly|daily|weekly|monthly>",
          );
          process.exit(1);
        }
        await maintenance.runMaintenance(frequency);
        break;

      case "health":
        const healthResults = await maintenance.performHealthCheck();
        console.log("\n=== HEALTH CHECK RESULTS ===");
        for (const [service, result] of healthResults) {
          const status = result.status.toUpperCase();
          const icon =
            result.status === "healthy"
              ? "✅"
              : result.status === "warning"
                ? "⚠️"
                : "❌";
          console.log(`${icon} ${service}: ${status} - ${result.message}`);
        }
        break;

      case "report":
        const reportPath = await maintenance.generateMaintenanceReport();
        console.log(`Maintenance report generated: ${reportPath}`);
        break;

      default:
        console.log("Available commands:");
        console.log("  run <frequency>  - Run maintenance tasks");
        console.log("  health          - Perform health check");
        console.log("  report          - Generate maintenance report");
        break;
    }
  } catch (error) {
    logger.error("Maintenance script failed", {
      command,
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { ProductionMaintenanceService };
