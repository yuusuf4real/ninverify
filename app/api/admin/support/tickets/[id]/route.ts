import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { supportTickets, ticketMessages, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

import { logger } from "../../../../../../lib/security/secure-logger";

export const runtime = "nodejs";

const updateTicketSchema = z.object({
  status: z
    .enum(["open", "assigned", "in_progress", "resolved", "closed"])
    .optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignedTo: z.string().optional(),
  assignToMe: z.boolean().optional(), // Special flag to assign to current admin
});

const addMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  isInternal: z.boolean().default(false),
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

    const { id: ticketId } = await params;

    // Fetch ticket details with user and assigned admin info
    const ticketResult = await db
      .select({
        id: supportTickets.id,
        userId: supportTickets.userId,
        category: supportTickets.category,
        subcategory: supportTickets.subcategory,
        status: supportTickets.status,
        priority: supportTickets.priority,
        subject: supportTickets.subject,
        description: supportTickets.description,
        transactionId: supportTickets.transactionId,
        verificationId: supportTickets.verificationId,
        paymentReference: supportTickets.paymentReference,
        assignedTo: supportTickets.assignedTo,
        department: supportTickets.department,
        slaTier: supportTickets.slaTier,
        firstResponseDue: supportTickets.firstResponseDue,
        resolutionDue: supportTickets.resolutionDue,
        firstResponseAt: supportTickets.firstResponseAt,
        satisfactionRating: supportTickets.satisfactionRating,
        satisfactionFeedback: supportTickets.satisfactionFeedback,
        sourceChannel: supportTickets.sourceChannel,
        userAgent: supportTickets.userAgent,
        ipAddress: supportTickets.ipAddress,
        metadata: supportTickets.metadata,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        resolvedAt: supportTickets.resolvedAt,
        closedAt: supportTickets.closedAt,
        userEmail: users.email,
        userFullName: users.fullName,
        userPhone: users.phone,
      })
      .from(supportTickets)
      .leftJoin(users, eq(supportTickets.userId, users.id))
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (ticketResult.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const ticket = ticketResult[0];

    // Get assigned admin info if ticket is assigned
    let assignedAdmin = null;
    if (ticket.assignedTo) {
      const adminResult = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, ticket.assignedTo))
        .limit(1);

      if (adminResult.length > 0) {
        assignedAdmin = adminResult[0];
      }
    }

    // Fetch ticket messages with sender info
    const messages = await db
      .select({
        id: ticketMessages.id,
        ticketId: ticketMessages.ticketId,
        senderId: ticketMessages.senderId,
        senderType: ticketMessages.senderType,
        message: ticketMessages.message,
        messageType: ticketMessages.messageType,
        isInternal: ticketMessages.isInternal,
        isSystemGenerated: ticketMessages.isSystemGenerated,
        attachments: ticketMessages.attachments,
        readAt: ticketMessages.readAt,
        metadata: ticketMessages.metadata,
        createdAt: ticketMessages.createdAt,
        senderName: users.fullName,
        senderEmail: users.email,
      })
      .from(ticketMessages)
      .leftJoin(users, eq(ticketMessages.senderId, users.id))
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(ticketMessages.createdAt);

    return NextResponse.json({
      ticket: {
        ...ticket,
        assignedAdmin,
      },
      messages,
    });
  } catch (error) {
    logger.error("Admin ticket detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket details" },
      { status: 500 },
    );
  }
}

export async function PATCH(
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

    const { id: ticketId } = await params;
    const body = await request.json();
    const updates = updateTicketSchema.parse(body);

    // Check if ticket exists
    const existingTicket = await db
      .select({ id: supportTickets.id, status: supportTickets.status })
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (existingTicket.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: new Date(),
    };

    // Handle assign to me functionality
    if (updates.assignToMe) {
      updateData.assignedTo = session.userId;
      updateData.status = "assigned";
      delete updateData.assignToMe; // Remove the flag from database update
    }

    // Set resolved/closed timestamps
    if (
      updates.status === "resolved" &&
      existingTicket[0].status !== "resolved"
    ) {
      updateData.resolvedAt = new Date();
    }
    if (updates.status === "closed" && existingTicket[0].status !== "closed") {
      updateData.closedAt = new Date();
    }

    // Update the ticket
    await db
      .update(supportTickets)
      .set(updateData)
      .where(eq(supportTickets.id, ticketId));

    // Log admin action
    logger.info("Admin updated ticket", {
      adminId: session.userId,
      ticketId,
      updates,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Admin ticket update error:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
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

    const { id: ticketId } = await params;
    const body = await request.json();
    const { message, isInternal } = addMessageSchema.parse(body);

    // Check if ticket exists
    const existingTicket = await db
      .select({ id: supportTickets.id })
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (existingTicket.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Create the message
    const messageId = nanoid();
    await db.insert(ticketMessages).values({
      id: messageId,
      ticketId,
      senderId: session.userId,
      senderType: "agent",
      message,
      messageType: "text",
      isInternal: isInternal || false,
      isSystemGenerated: false,
      createdAt: new Date(),
    });

    // Update ticket's updatedAt and firstResponseAt if this is the first admin response
    const updateTicketData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Check if this is the first admin response
    const existingAdminMessages = await db
      .select({ id: ticketMessages.id })
      .from(ticketMessages)
      .where(
        and(
          eq(ticketMessages.ticketId, ticketId),
          eq(ticketMessages.senderType, "agent"),
        ),
      )
      .limit(1);

    if (existingAdminMessages.length === 1) {
      // This is the first admin response
      updateTicketData.firstResponseAt = new Date();
    }

    await db
      .update(supportTickets)
      .set(updateTicketData)
      .where(eq(supportTickets.id, ticketId));

    // Log admin action
    logger.info("Admin added message to ticket", {
      adminId: session.userId,
      ticketId,
      messageId,
      isInternal,
    });

    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    logger.error("Admin add message error:", error);
    return NextResponse.json(
      { error: "Failed to add message" },
      { status: 500 },
    );
  }
}
