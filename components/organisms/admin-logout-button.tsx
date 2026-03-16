"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ADMIN_SECURITY_CONFIG } from "@/lib/security/admin-security";

export function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push(ADMIN_SECURITY_CONFIG.ADMIN_LOGIN_PATH);
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={loading}
      variant="outline"
      size="sm"
      className="w-full justify-start gap-2 text-gray-600 hover:text-gray-900"
    >
      <LogOut className="h-4 w-4" />
      {loading ? "Signing out..." : "Sign Out"}
    </Button>
  );
}
