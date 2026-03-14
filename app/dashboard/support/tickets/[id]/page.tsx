import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardTicketClient } from "./dashboard-ticket-client";

export default async function DashboardTicketPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  return <DashboardTicketClient ticketId={params.id} user={session} />;
}