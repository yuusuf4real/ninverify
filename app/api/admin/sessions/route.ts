import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { verificationSessions } from "@/db/new-schema";
import { desc } from "drizzle-orm";
import { logger } from "@/lib/security/secure-logger";

export async function GET() {
  try {
    const sessions = await db
      .select({
        id: verificationSessions.id,
        phoneNumber: verificationSessions.phoneNumber,
        status: verificationSessions.status,
        dataLayerSelected: verificationSessions.dataLayerSelected,
        paymentStatus: verificationSessions.paymentStatus,
        paymentAmount: verificationSessions.paymentAmount,
        createdAt: verificationSessions.createdAt,
        completedAt: verificationSessions.completedAt,
      })
      .from(verificationSessions)
      .orderBy(desc(verificationSessions.createdAt))
      .limit(100);

    return NextResponse.json({ sessions });
  } catch (error) {
    logger.error("Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 },
    );
  }
}
