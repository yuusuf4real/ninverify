import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { supportTickets, ticketMessages, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import {
  cursorFromMessage,
  decodeTicketCursor,
  encodeTicketCursor,
} from "@/lib/support-stream";
import { and, asc, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { logger } from "@/lib/security/secure-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const POLL_INTERVAL_MS = 2000;
const HEARTBEAT_INTERVAL_MS = 15000;

const encoder = new TextEncoder();

const formatSse = (event: string, data: unknown, id?: string) => {
  const payload = `event: ${event}\n${id ? `id: ${id}\n` : ""}data: ${JSON.stringify(data)}\n\n`;
  return encoder.encode(payload);
};

const buildCursorCondition = (timestamp: number, id: string) => {
  const cursorDate = new Date(timestamp);
  if (!id) {
    return gt(ticketMessages.createdAt, cursorDate);
  }

  return or(
    gt(ticketMessages.createdAt, cursorDate),
    and(eq(ticketMessages.createdAt, cursorDate), gt(ticketMessages.id, id)),
  );
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const ticketId = id;

  const ticket = await db
    .select({ userId: supportTickets.userId })
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId))
    .limit(1);

  if (!ticket.length) {
    return new Response("Ticket not found", { status: 404 });
  }

  const isAdmin = session.role === "admin" || session.role === "super_admin";
  const isOwner = ticket[0].userId === session.userId;

  if (!isAdmin && !isOwner) {
    return new Response("Access denied", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const cursorRaw =
    request.headers.get("last-event-id") || searchParams.get("cursor");
  const cursor = decodeTicketCursor(cursorRaw);
  let lastTimestamp = cursor?.timestamp ?? Date.now() - 5000;
  let lastId = cursor?.id ?? "";

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
      let pollInterval: ReturnType<typeof setInterval> | null = null;

      const send = (event: string, data: unknown, id?: string) => {
        if (closed) return;
        controller.enqueue(formatSse(event, data, id));
      };

      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        if (pollInterval) clearInterval(pollInterval);
        controller.close();
      };

      const poll = async () => {
        try {
          const conditions = [eq(ticketMessages.ticketId, ticketId)];

          if (!isAdmin) {
            conditions.push(eq(ticketMessages.isInternal, false));
          }

          if (Number.isFinite(lastTimestamp)) {
            const cursorCondition = buildCursorCondition(lastTimestamp, lastId);
            if (cursorCondition) {
              conditions.push(cursorCondition);
            }
          }

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
            .where(and(...conditions))
            .orderBy(asc(ticketMessages.createdAt), asc(ticketMessages.id))
            .limit(50);

          if (messages.length) {
            const lastMessage = messages[messages.length - 1];
            const nextCursor = cursorFromMessage(lastMessage);
            const encodedCursor = encodeTicketCursor(nextCursor);

            lastTimestamp = nextCursor.timestamp;
            lastId = nextCursor.id;

            send(
              "messages",
              {
                messages,
                cursor: encodedCursor,
              },
              encodedCursor,
            );

            if (!isAdmin) {
              const agentMessageIds = messages
                .filter((message) => message.senderType === "agent")
                .map((message) => message.id);

              if (agentMessageIds.length) {
                await db
                  .update(ticketMessages)
                  .set({ readAt: new Date() })
                  .where(
                    and(
                      eq(ticketMessages.ticketId, ticketId),
                      inArray(ticketMessages.id, agentMessageIds),
                      isNull(ticketMessages.readAt),
                    ),
                  );
              }
            }
          }
        } catch (error) {
          logger.error("Support ticket stream error:", error);
          send("error", { message: "Stream error" });
        }
      };

      heartbeatInterval = setInterval(() => {
        send("ping", { ts: Date.now() });
      }, HEARTBEAT_INTERVAL_MS);

      pollInterval = setInterval(poll, POLL_INTERVAL_MS);

      send("ready", { connectedAt: new Date().toISOString() });
      poll();

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
