import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardTicketClient } from "./dashboard-ticket-client";

export default async function DashboardTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  return <DashboardTicketClient ticketId={id} user={session} />;
}
