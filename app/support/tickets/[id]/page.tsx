import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

interface TicketPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  // Redirect to dashboard support ticket page
  redirect(`/dashboard/support/tickets/${id}`);
}
