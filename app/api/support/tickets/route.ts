import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { supportTickets, ticketMessages, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { withDatabaseHealth } from "@/lib/db-health";
import {
  detectIssueType,
  calculateSLADeadlines,
  generateTicketSubject,
  generateSystemMessage,
  generateTicketId,
  type TicketContext,
} from "@/lib/support-tickets";
import { eq, desc } from "drizzle-orm";

import { logger } from "../../../../lib/security/secure-logger";
export const runtime = "nodejs";

const createTicketSchema = z.object({
  category: z.enum([
    "payment_issue",
    "verification_problem",
    "account_access",
    "technical_support",
    "general_inquiry",
  ]),
  subcategory: z.string().min(1),
  description: z.string().min(10).max(2000),
  urgency: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  contactPreferences: z.array(z.string()).default(["email"]),
  relatedTransaction: z.string().optional(),
  relatedVerification: z.string().optional(),
});

// GET /api/support/tickets - List user's tickets
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

    // Fetch user's tickets with message counts
    const userTickets = await withDatabaseHealth(async () => {
      return await db
        .select({
          id: supportTickets.id,
          category: supportTickets.category,
          status: supportTickets.status,
          priority: supportTickets.priority,
          subject: supportTickets.subject,
          description: supportTickets.description,
          createdAt: supportTickets.createdAt,
          updatedAt: supportTickets.updatedAt,
          resolvedAt: supportTickets.resolvedAt,
          assignedAdminName: users.fullName,
          satisfactionRating: supportTickets.satisfactionRating,
        })
        .from(supportTickets)
        .leftJoin(users, eq(supportTickets.assignedTo, users.id))
        .where(eq(supportTickets.userId, session.userId))
        .orderBy(desc(supportTickets.createdAt))
        .limit(limit)
        .offset(offset);
    });

    // Get message counts for each ticket
    const ticketsWithCounts = await Promise.all(
      userTickets.map(async (ticket) => {
        const messageCount = await db
          .select({ count: ticketMessages.id })
          .from(ticketMessages)
          .where(eq(ticketMessages.ticketId, ticket.id));

        // Get last message
        const lastMessage = await db
          .select({ message: ticketMessages.message })
          .from(ticketMessages)
          .where(eq(ticketMessages.ticketId, ticket.id))
          .orderBy(desc(ticketMessages.createdAt))
          .limit(1);

        return {
          ...ticket,
          messageCount: messageCount.length,
          lastMessage: lastMessage[0]?.message,
        };
      }),
    );

    return NextResponse.json({
      tickets: ticketsWithCounts,
      pagination: {
        page,
        limit,
        total: userTickets.length,
        hasMore: userTickets.length === limit,
      },
    });
  } catch (error) {
    logger.error("Support tickets list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch support tickets" },
      { status: 500 },
    );
  }
}

// POST /api/support/tickets - Create new ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createTicketSchema.parse(body);

    // Build user context for smart routing
    const userContext: TicketContext = {
      userId: session.userId,
      recentTransactions: [],
      recentVerifications: [],
      userTier: "basic",
      previousTickets: 0,
      accountAge: 30,
    };

    // Detect issue type and routing
    const issueDetection = detectIssueType(
      data.description,
      data.category,
      userContext,
    );

    // Calculate SLA deadlines
    const slaDeadlines = calculateSLADeadlines(
      issueDetection.priority,
      issueDetection.slaTier,
    );

    // Generate ticket subject
    const subject = generateTicketSubject(
      data.category,
      data.subcategory,
      undefined,
    );

    // Create ticket
    const ticketId = generateTicketId();

    await db.insert(supportTickets).values({
      id: ticketId,
      userId: session.userId,
      category: data.category,
      subcategory: data.subcategory,
      status: "open",
      priority: issueDetection.priority,
      subject,
      description: data.description,
      department: issueDetection.department,
      slaTier: issueDetection.slaTier,
      firstResponseDue: slaDeadlines.firstResponseDue,
      resolutionDue: slaDeadlines.resolutionDue,
      sourceChannel: "web",
      userAgent: request.headers.get("user-agent") || undefined,
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      transactionId: data.relatedTransaction,
      verificationId: data.relatedVerification,
      metadata: {
        urgency: data.urgency,
        contactPreferences: data.contactPreferences,
        issueDetection: {
          confidence: issueDetection.confidence,
          suggestedSolution: issueDetection.suggestedSolution,
        },
        // Type-safe related context
        ...(issueDetection.relatedContext && {
          relatedContext: issueDetection.relatedContext,
        }),
      },
    });

    // Create initial system message
    const systemMessage = generateSystemMessage(
      data.category,
      issueDetection.priority,
      slaDeadlines,
    );

    await db.insert(ticketMessages).values({
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ticketId,
      senderId: "system",
      senderType: "system",
      message: systemMessage,
      messageType: "system_note",
      isSystemGenerated: true,
    });

    return NextResponse.json({
      ticketId,
      subject,
      priority: issueDetection.priority,
      department: issueDetection.department,
      expectedResponse: slaDeadlines.firstResponseDue,
      message: "Support ticket created successfully",
    });
  } catch (error) {
    logger.error("Create support ticket error:", error);

    // Type-safe error handling
    const errorDetails: Record<string, unknown> = {};
    if (error && typeof error === "object") {
      if ("message" in error) errorDetails.message = error.message;
      if ("code" in error) errorDetails.code = error.code;
      if ("position" in error) errorDetails.position = error.position;
      if ("routine" in error) errorDetails.routine = error.routine;
    }

    logger.info("Error details:", errorDetails);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create support ticket" },
      { status: 500 },
    );
  }
}
