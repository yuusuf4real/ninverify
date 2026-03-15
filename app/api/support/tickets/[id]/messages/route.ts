import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { supportTickets, ticketMessages, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, isNull } from "drizzle-orm";

import { logger } from "../../../../../../lib/security/secure-logger";
export const runtime = "nodejs";

const createMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  messageType: z.enum(["text", "image", "file", "system_note"]).default("text"),
  isInternal: z.boolean().default(false),
  attachments: z.array(z.any()).optional(),
});

// GET /api/support/tickets/[id]/messages - Get ticket messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const ticketId = id;

    // Verify ticket access
    const ticket = await db
      .select({ userId: supportTickets.userId })
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (!ticket.length) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const isAdmin = session.role === "admin" || session.role === "super_admin";
    const isOwner = ticket[0].userId === session.userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch messages
    const messages = await db
      .select({
        id: ticketMessages.id,
        senderId: ticketMessages.senderId,
        senderType: ticketMessages.senderType,
        senderName: users.fullName,
        message: ticketMessages.message,
        messageType: ticketMessages.messageType,
        isInternal: ticketMessages.isInternal,
        isSystemGenerated: ticketMessages.isSystemGenerated,
        attachments: ticketMessages.attachments,
        readAt: ticketMessages.readAt,
        createdAt: ticketMessages.createdAt,
      })
      .from(ticketMessages)
      .leftJoin(users, eq(ticketMessages.senderId, users.id))
      .where(
        and(
          eq(ticketMessages.ticketId, ticketId),
          // Hide internal messages from non-admin users
          isAdmin ? undefined : eq(ticketMessages.isInternal, false),
        ),
      )
      .orderBy(ticketMessages.createdAt);

    // Mark messages as read for the current user
    if (!isAdmin) {
      await db
        .update(ticketMessages)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(ticketMessages.ticketId, ticketId),
            eq(ticketMessages.senderType, "agent"),
            isNull(ticketMessages.readAt),
          ),
        );
    }

    return NextResponse.json({
      messages,
    });
  } catch (error) {
    logger.error("Get ticket messages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

// POST /api/support/tickets/[id]/messages - Add message to ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const ticketId = id;
    const body = await request.json();
    const data = createMessageSchema.parse(body);

    // Verify ticket access and status
    const ticket = await db
      .select({
        userId: supportTickets.userId,
        status: supportTickets.status,
        firstResponseAt: supportTickets.firstResponseAt,
      })
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (!ticket.length) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const isAdmin = session.role === "admin" || session.role === "super_admin";
    const isOwner = ticket[0].userId === session.userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if ticket is closed
    if (ticket[0].status === "closed" && !isAdmin) {
      return NextResponse.json(
        { error: "Cannot add messages to closed tickets" },
        { status: 400 },
      );
    }

    // Determine sender type
    const senderType = isAdmin ? "agent" : "user";

    // Create message
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.insert(ticketMessages).values({
      id: messageId,
      ticketId,
      senderId: session.userId,
      senderType,
      message: data.message,
      messageType: data.messageType,
      isInternal: data.isInternal && isAdmin, // Only admins can create internal messages
      attachments: data.attachments,
      isSystemGenerated: false,
    });

    // Update ticket status and timestamps
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // If this is the first admin response, record it
    if (isAdmin && !ticket[0].firstResponseAt) {
      updates.firstResponseAt = new Date();
    }

    // Auto-update status based on sender
    if (isAdmin && ticket[0].status === "open") {
      updates.status = "in_progress";
    } else if (!isAdmin && ticket[0].status === "resolved") {
      updates.status = "open"; // Customer replied to resolved ticket
    }

    await db
      .update(supportTickets)
      .set(updates)
      .where(eq(supportTickets.id, ticketId));

    return NextResponse.json({
      messageId,
      message: "Message added successfully",
    });
  } catch (error) {
    logger.error("Add ticket message error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid message data", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to add message" },
      { status: 500 },
    );
  }
}
