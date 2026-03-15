import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { ninVerifications, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, gte, lte, count, sql, and } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit-log";

import { logger } from "../../../../../lib/security/secure-logger";
export const runtime = "nodejs";

const querySchema = z.object({
  period: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getSession();
    if (
      !session ||
      (session.role !== "admin" && session.role !== "super_admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);

    if (query.dateFrom && query.dateTo) {
      startDate = new Date(query.dateFrom);
      endDate = new Date(query.dateTo);
    } else {
      const periodDays = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "1y": 365,
      };
      startDate = new Date(
        now.getTime() - periodDays[query.period] * 24 * 60 * 60 * 1000,
      );
    }

    // Get overall verification statistics
    const [overallStats] = await db
      .select({
        totalVerifications: count(),
        successfulVerifications: sql<number>`COALESCE(SUM(CASE WHEN ${ninVerifications.status} = 'success' THEN 1 ELSE 0 END), 0)`,
        failedVerifications: sql<number>`COALESCE(SUM(CASE WHEN ${ninVerifications.status} = 'failed' THEN 1 ELSE 0 END), 0)`,
        pendingVerifications: sql<number>`COALESCE(SUM(CASE WHEN ${ninVerifications.status} = 'pending' THEN 1 ELSE 0 END), 0)`,
      })
      .from(ninVerifications)
      .where(
        and(
          gte(ninVerifications.createdAt, startDate),
          lte(ninVerifications.createdAt, endDate),
        ),
      );

    const successRate =
      overallStats.totalVerifications > 0
        ? (Number(overallStats.successfulVerifications) /
            overallStats.totalVerifications) *
          100
        : 0;

    // Get verification trends by day
    const dailyTrends = await db
      .select({
        date: sql<string>`DATE(${ninVerifications.createdAt})`,
        totalCount: count(),
        successCount: sql<number>`COALESCE(SUM(CASE WHEN ${ninVerifications.status} = 'success' THEN 1 ELSE 0 END), 0)`,
        failedCount: sql<number>`COALESCE(SUM(CASE WHEN ${ninVerifications.status} = 'failed' THEN 1 ELSE 0 END), 0)`,
      })
      .from(ninVerifications)
      .where(
        and(
          gte(ninVerifications.createdAt, startDate),
          lte(ninVerifications.createdAt, endDate),
        ),
      )
      .groupBy(sql`DATE(${ninVerifications.createdAt})`)
      .orderBy(sql`DATE(${ninVerifications.createdAt})`);

    // Get verification by purpose
    const purposeBreakdown = await db
      .select({
        purpose: ninVerifications.purpose,
        count: count(),
        successCount: sql<number>`COALESCE(SUM(CASE WHEN ${ninVerifications.status} = 'success' THEN 1 ELSE 0 END), 0)`,
      })
      .from(ninVerifications)
      .where(
        and(
          gte(ninVerifications.createdAt, startDate),
          lte(ninVerifications.createdAt, endDate),
        ),
      )
      .groupBy(ninVerifications.purpose)
      .orderBy(sql`count DESC`);

    // Get top error messages for failed verifications
    const errorAnalysis = await db
      .select({
        errorMessage: ninVerifications.errorMessage,
        count: count(),
      })
      .from(ninVerifications)
      .where(
        and(
          eq(ninVerifications.status, "failed"),
          gte(ninVerifications.createdAt, startDate),
          lte(ninVerifications.createdAt, endDate),
        ),
      )
      .groupBy(ninVerifications.errorMessage)
      .orderBy(sql`count DESC`)
      .limit(10);

    // Get recent verifications with user info
    const recentVerifications = await db
      .select({
        id: ninVerifications.id,
        status: ninVerifications.status,
        purpose: ninVerifications.purpose,
        createdAt: ninVerifications.createdAt,
        errorMessage: ninVerifications.errorMessage,
        userEmail: users.email,
        userFullName: users.fullName,
      })
      .from(ninVerifications)
      .leftJoin(users, eq(ninVerifications.userId, users.id))
      .where(
        and(
          gte(ninVerifications.createdAt, startDate),
          lte(ninVerifications.createdAt, endDate),
        ),
      )
      .orderBy(sql`${ninVerifications.createdAt} DESC`)
      .limit(20);

    // Calculate average processing time (mock data for now)
    const avgProcessingTime = 2.1; // seconds

    // Get today's statistics
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [todayStats] = await db
      .select({
        todayCount: count(),
        todaySuccess: sql<number>`COALESCE(SUM(CASE WHEN ${ninVerifications.status} = 'success' THEN 1 ELSE 0 END), 0)`,
      })
      .from(ninVerifications)
      .where(gte(ninVerifications.createdAt, today));

    // Log admin action
    await logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: "api.error", // Using existing event type
      userId: session.userId,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      resource: "verification_analytics",
      action: "view",
      status: "success",
      metadata: {
        period: query.period,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      },
    });

    return NextResponse.json({
      overview: {
        totalVerifications: overallStats.totalVerifications,
        successfulVerifications: Number(overallStats.successfulVerifications),
        failedVerifications: Number(overallStats.failedVerifications),
        pendingVerifications: Number(overallStats.pendingVerifications),
        successRate: Math.round(successRate * 10) / 10,
        avgProcessingTime,
        todayCount: todayStats.todayCount,
        todaySuccessRate:
          todayStats.todayCount > 0
            ? Math.round(
                (Number(todayStats.todaySuccess) / todayStats.todayCount) *
                  100 *
                  10,
              ) / 10
            : 0,
      },
      trends: {
        daily: dailyTrends.map((day) => ({
          date: day.date,
          total: day.totalCount,
          successful: Number(day.successCount),
          failed: Number(day.failedCount),
          successRate:
            day.totalCount > 0
              ? Math.round(
                  (Number(day.successCount) / day.totalCount) * 100 * 10,
                ) / 10
              : 0,
        })),
      },
      breakdown: {
        byPurpose: purposeBreakdown.map((item) => ({
          purpose: item.purpose || "unknown",
          count: item.count,
          successCount: Number(item.successCount),
          successRate:
            item.count > 0
              ? Math.round(
                  (Number(item.successCount) / item.count) * 100 * 10,
                ) / 10
              : 0,
        })),
      },
      errors: {
        topErrors: errorAnalysis
          .filter((error) => error.errorMessage)
          .map((error) => ({
            message: error.errorMessage,
            count: error.count,
          })),
      },
      recent: recentVerifications.map((verification) => ({
        ...verification,
        purpose: verification.purpose || "unknown",
      })),
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        period: query.period,
      },
    });
  } catch (error) {
    logger.error("Verification analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification analytics" },
      { status: 500 },
    );
  }
}
