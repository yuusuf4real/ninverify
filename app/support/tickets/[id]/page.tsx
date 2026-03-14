import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

interface TicketPageProps {
  params: {
    id: string;
  };
}

export default async function TicketPage({ params }: TicketPageProps) {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  // Redirect to dashboard support ticket page
  redirect(`/dashboard/support/tickets/${params.id}`);
}