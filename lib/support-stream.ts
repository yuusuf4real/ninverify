export type TicketMessageCursor = {
  timestamp: number;
  id: string;
};

export const encodeTicketCursor = (cursor: TicketMessageCursor) => {
  return `${cursor.timestamp}:${cursor.id}`;
};

export const decodeTicketCursor = (
  value: string | null | undefined,
): TicketMessageCursor | null => {
  if (!value) return null;
  const [timestampRaw, id] = value.split(":");
  if (!timestampRaw || !id) return null;

  const timestamp = Number(timestampRaw);
  if (!Number.isFinite(timestamp)) return null;

  return { timestamp, id };
};

export const cursorFromMessage = (message: {
  id: string;
  createdAt: string | Date;
}): TicketMessageCursor => {
  const createdAt =
    message.createdAt instanceof Date
      ? message.createdAt
      : new Date(message.createdAt);

  return {
    timestamp: createdAt.getTime(),
    id: message.id,
  };
};
