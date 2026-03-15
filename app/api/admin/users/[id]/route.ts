import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import {
  users,
  wallets,
  walletTransactions,
  ninVerifications,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit-log";

import { logger } from "../../../../../lib/security/secure-logger";
export const runtime = "nodejs";

const suspendSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  duration: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check admin authentication
    const session = await getSession();
    if (
      !session ||
      (session.role !== "admin" && session.role !== "super_admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await params;

    // Get user details with wallet
    const [userDetail] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        isSuspended: users.isSuspended,
        createdAt: users.createdAt,
        balance: wallets.balance,
        walletId: wallets.id,
      })
      .from(users)
      .leftJoin(wallets, eq(users.id, wallets.userId))
      .where(eq(users.id, userId));

    if (!userDetail) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get recent transactions
    const recentTransactions = await db
      .select({
        id: walletTransactions.id,
        type: walletTransactions.type,
        amount: walletTransactions.amount,
        status: walletTransactions.status,
        description: walletTransactions.description,
        createdAt: walletTransactions.createdAt,
      })
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(10);

    // Get recent verifications
    const recentVerifications = await db
      .select({
        id: ninVerifications.id,
        ninMasked: ninVerifications.ninMasked,
        status: ninVerifications.status,
        purpose: ninVerifications.purpose,
        createdAt: ninVerifications.createdAt,
      })
      .from(ninVerifications)
      .where(eq(ninVerifications.userId, userId))
      .orderBy(desc(ninVerifications.createdAt))
      .limit(10);

    // Calculate stats
    const totalSpent = recentTransactions
      .filter((t) => t.type === "debit" && t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0);

    const successfulVerifications = recentVerifications.filter(
      (v) => v.status === "success",
    ).length;

    // Log admin action
    await logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: "api.error", // Using existing event type
      userId: session.userId,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      resource: "user",
      action: "view",
      status: "success",
      metadata: {
        targetUserId: userId,
        targetUserEmail: userDetail.email,
      },
    });

    return NextResponse.json({
      user: userDetail,
      transactions: recentTransactions,
      verifications: recentVerifications,
      stats: {
        totalSpent,
        successfulVerifications,
        accountAge: Math.floor(
          (Date.now() - userDetail.createdAt.getTime()) / (1000 * 60 * 60 * 24),
        ),
      },
    });
  } catch (error) {
    logger.error("Admin user detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check admin authentication
    const session = await getSession();
    if (
      !session ||
      (session.role !== "admin" && session.role !== "super_admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "suspend") {
      const body = await request.json();
      const data = suspendSchema.parse(body);

      // Update user suspension status
      await db
        .update(users)
        .set({ isSuspended: true })
        .where(eq(users.id, userId));

      // Log admin action
      await logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: "api.error", // Using existing event type
        userId: session.userId,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        resource: "user",
        action: "suspend",
        status: "success",
        metadata: {
          targetUserId: userId,
          reason: data.reason,
          duration: data.duration,
        },
      });

      return NextResponse.json({
        success: true,
        message: "User suspended successfully",
      });
    } else if (action === "activate") {
      // Update user suspension status
      await db
        .update(users)
        .set({ isSuspended: false })
        .where(eq(users.id, userId));

      // Log admin action
      await logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: "api.error", // Using existing event type
        userId: session.userId,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        resource: "user",
        action: "activate",
        status: "success",
        metadata: {
          targetUserId: userId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "User activated successfully",
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    logger.error("Admin user action error:", error);
    return NextResponse.json(
      { error: "Failed to perform user action" },
      { status: 500 },
    );
  }
}
