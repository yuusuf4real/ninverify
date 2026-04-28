/**
 * App Providers
 * Wraps the app with necessary providers (Toast, Loading, etc.)
 */

"use client";

import { ToastContainer } from "@/components/ui/toast";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastContainer />
      <LoadingOverlay />
    </>
  );
}
