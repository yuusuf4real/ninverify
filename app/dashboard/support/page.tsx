import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { UserTicketDashboard } from "@/components/organisms/user-ticket-dashboard";

export default async function DashboardSupportPage() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  return <UserTicketDashboard user={session} />;
}