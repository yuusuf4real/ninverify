import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function SupportPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Redirect to dashboard support page
  redirect("/dashboard/support");
}
