"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-red-600 hover:bg-red-50"
      onClick={onLogout}
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Sign Out</span>
    </Button>
  );
}
