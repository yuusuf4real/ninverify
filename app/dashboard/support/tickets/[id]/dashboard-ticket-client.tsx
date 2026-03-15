"use client";

import { useRouter } from "next/navigation";
import { TicketConversation } from "@/components/organisms/ticket-conversation";

interface DashboardTicketClientProps {
  ticketId: string;
  user: {
    userId: string;
    email: string;
    fullName: string;
  };
}

export function DashboardTicketClient({
  ticketId,
  user,
}: DashboardTicketClientProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push("/dashboard/support");
  };

  return (
    <TicketConversation
      ticketId={ticketId}
      user={{
        id: user.userId,
        email: user.email,
        fullName: user.fullName,
      }}
      onBack={handleBack}
    />
  );
}
