import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFriendlyErrorMessage(error: unknown, fallback: string) {
  const defaultMessage = fallback || "Something went wrong. Please try again.";

  if (error instanceof Error) {
    const raw = error.message || defaultMessage;
    const lowered = raw.toLowerCase();

    if (
      lowered.includes("connection terminated unexpectedly") ||
      lowered.includes("ecconnreset") ||
      lowered.includes("econnrefused") ||
      lowered.includes("could not connect") ||
      lowered.includes("getaddrinfo enotfound")
    ) {
      return "We’re having trouble talking to our database. Please try again in a few minutes.";
    }

    if (
      lowered.includes("auth_secret is not configured") ||
      lowered.includes("database_url is not set")
    ) {
      return "Our service is temporarily misconfigured. Please try again shortly while we fix this.";
    }

    if (lowered.includes("youverify") || lowered.includes("paystack")) {
      return "Our verification or payment provider is currently unavailable. Please try again in a few minutes.";
    }

    if (
      lowered.includes("failed to fetch") ||
      lowered.includes("networkerror")
    ) {
      return "We couldn’t reach the server. Please check your connection and try again.";
    }

    return defaultMessage;
  }

  return defaultMessage;
}
