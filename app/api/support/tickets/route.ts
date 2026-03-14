import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { supportTickets, ticketMessages, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { 
  detectIssueType, 
  calculateSLADeadlines, 
  generateTicketSubject, 
  generateSystemMessage,
  generateTicketId,
  type TicketContext
} from "@/lib/support-tickets";
import { eq, desc, and } from "drizzle-orm";

export const runtime = "nodejs";

const createTicketSchema = z.object({
  category: z.enum(["payment_issue", "verification_problem", "account_access", "technical_support", "general_inquiry"]),
  subcategory: z.string().min(1),
  description: z.string().min(10).max(2000),
  urgency: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  contactPreferences: z.array(z.string()).default(["email"]),
  relatedTransaction: z.string().optional(),
  relatedVerification: z.string().optional()
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
    const userTickets = await db
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
        satisfactionRating: supportTickets.satisfactionRating
      })
      .from(supportTickets)
      .leftJoin(users, eq(supportTickets.assignedTo, users.id))
      .where(eq(supportTickets.userId, session.userId))
      .orderBy(desc(supportTickets.createdAt))
      .limit(limit)
      .offset(offset);

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
          lastMessage: lastMessage[0]?.message
        };
      })
    );

    return NextResponse.json({
      tickets: ticketsWithCounts,
      pagination: {
        page,
        limit,
        total: userTickets.length,
        hasMore: userTickets.length === limit
      }
    });

  } catch (error) {
    console.error("Support tickets list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch support tickets" },
      { status: 500 }
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
      recentTransactions: [], // TODO: Fetch from DB
      recentVerifications: [], // TODO: Fetch from DB
      userTier: "basic", // TODO: Determine from user data
      previousTickets: 0, // TODO: Count from DB
      accountAge: 30 // TODO: Calculate from user creation date
    };

    // Detect issue type and routing
    const issueDetection = detectIssueType(data.description, data.category, userContext);
    
    // Calculate SLA deadlines
    const slaDeadlines = calculateSLADeadlines(
      issueDetection.priority,
      issueDetection.slaTier
    );

    // Generate ticket subject
    const subject = generateTicketSubject(
      data.category,
      data.subcategory,
      issueDetection.relatedContext
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
      ipAddress: request.headers.get("x-forwarded-for") || 
                 request.headers.get("x-real-ip") || 
                 "unknown",
      transactionId: data.relatedTransaction,
      verificationId: data.relatedVerification,
      metadata: {
        urgency: data.urgency,
        contactPreferences: data.contactPreferences,
        issueDetection: {
          confidence: issueDetection.confidence,
          suggestedSolution: issueDetection.suggestedSolution
        }
      }
    });

    // Create initial system message
    const systemMessage = generateSystemMessage(
      data.category,
      issueDetection.priority,
      slaDeadlines
    );

    await db.insert(ticketMessages).values({
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ticketId,
      senderId: "system",
      senderType: "system",
      message: systemMessage,
      messageType: "system_note",
      isSystemGenerated: true
    });

    return NextResponse.json({
      ticketId,
      subject,
      priority: issueDetection.priority,
      department: issueDetection.department,
      expectedResponse: slaDeadlines.firstResponseDue,
      message: "Support ticket created successfully"
    });

  } catch (error) {
    console.log("Create support ticket error:", error);
    console.log("Error details:", {
      message: error.message,
      code: error.code,
      position: error.position,
      routine: error.routine
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create support ticket" },
      { status: 500 }
    );
  }
}