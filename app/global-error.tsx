"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log detailed error information
    console.error("=== GLOBAL ERROR ===");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("Digest:", error.digest);
    console.error("Error object:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            padding: "2rem",
            maxWidth: "800px",
            margin: "0 auto",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ color: "#dc2626" }}>Application Error</h1>
          <p style={{ marginTop: "1rem", fontSize: "1.125rem" }}>
            {error.message || "An unexpected error occurred"}
          </p>
          {error.digest && (
            <p style={{ marginTop: "0.5rem", color: "#6b7280" }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: "2rem",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              display: "inline-block",
              marginTop: "1rem",
              marginLeft: "1rem",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#f3f4f6",
              color: "#1f2937",
              textDecoration: "none",
              borderRadius: "0.5rem",
              fontSize: "1rem",
            }}
          >
            Go to Homepage
          </a>
        </div>
      </body>
    </html>
  );
}
