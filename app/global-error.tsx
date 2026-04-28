"use client";

import { useEffect } from "react";
import Link from "next/link";

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
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Application Error - VerifyNIN</title>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #fef3f2 0%, #fff 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          .container {
            max-width: 600px;
            width: 100%;
            background: white;
            border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            padding: 2rem;
          }
          .icon {
            width: 64px;
            height: 64px;
            background: #fee2e2;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
          }
          .icon svg {
            width: 32px;
            height: 32px;
            color: #dc2626;
          }
          h1 {
            font-size: 1.875rem;
            font-weight: 700;
            color: #111827;
            text-align: center;
            margin-bottom: 1rem;
          }
          .message {
            font-size: 1rem;
            color: #6b7280;
            text-align: center;
            line-height: 1.6;
            margin-bottom: 1rem;
          }
          .error-id {
            background: #f3f4f6;
            border-radius: 0.5rem;
            padding: 0.75rem;
            margin: 1.5rem 0;
            text-align: center;
          }
          .error-id-label {
            font-size: 0.75rem;
            color: #6b7280;
            margin-bottom: 0.25rem;
          }
          .error-id-value {
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            color: #111827;
            font-weight: 600;
          }
          .actions {
            display: flex;
            gap: 0.75rem;
            margin-top: 2rem;
            flex-wrap: wrap;
          }
          .btn {
            flex: 1;
            min-width: 140px;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-weight: 600;
            text-align: center;
            text-decoration: none;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
          }
          .btn-primary {
            background: #008751;
            color: white;
          }
          .btn-primary:hover {
            background: #006d40;
          }
          .btn-secondary {
            background: #f3f4f6;
            color: #111827;
          }
          .btn-secondary:hover {
            background: #e5e7eb;
          }
          .help-box {
            margin-top: 2rem;
            padding: 1.5rem;
            background: #f9fafb;
            border-radius: 0.75rem;
            border: 1px solid #e5e7eb;
          }
          .help-title {
            font-size: 0.875rem;
            font-weight: 600;
            color: #111827;
            margin-bottom: 1rem;
          }
          .help-list {
            list-style: none;
            font-size: 0.875rem;
            color: #6b7280;
            line-height: 1.8;
          }
          .help-list li {
            padding-left: 1.5rem;
            position: relative;
          }
          .help-list li:before {
            content: "→";
            position: absolute;
            left: 0;
            color: #008751;
            font-weight: bold;
          }
          .support-link {
            display: inline-block;
            margin-top: 1rem;
            color: #008751;
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 600;
          }
          .support-link:hover {
            text-decoration: underline;
          }
          @media (max-width: 640px) {
            .container {
              padding: 1.5rem;
            }
            h1 {
              font-size: 1.5rem;
            }
            .actions {
              flex-direction: column;
            }
            .btn {
              width: 100%;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1>Something Went Wrong</h1>
          <p className="message">
            We encountered an unexpected error. Our team has been notified and
            is working to fix it. Please try again in a few moments.
          </p>

          {error.digest && (
            <div className="error-id">
              <div className="error-id-label">Error ID</div>
              <div className="error-id-value">{error.digest}</div>
              <div
                className="error-id-label"
                style={{ marginTop: "0.5rem", fontSize: "0.7rem" }}
              >
                Please include this ID when contacting support
              </div>
            </div>
          )}

          <div className="actions">
            <button onClick={reset} className="btn btn-primary">
              Try Again
            </button>
            <Link href="/" className="btn btn-secondary">
              Go to Homepage
            </Link>
          </div>

          <div className="help-box">
            <div className="help-title">What you can do:</div>
            <ul className="help-list">
              <li>Refresh the page and try again</li>
              <li>Check your internet connection</li>
              <li>Clear your browser cache</li>
              <li>Try using a different browser</li>
            </ul>
            <a href="mailto:support@verifynin.ng" className="support-link">
              Contact Support →
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
