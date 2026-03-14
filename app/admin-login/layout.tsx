import type { ReactNode } from "react";

export default function AdminLoginLayout({
  children
}: {
  children: ReactNode;
}) {
  // Simple layout without authentication checks
  return <>{children}</>;
}