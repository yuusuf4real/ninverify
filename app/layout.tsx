import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Sora, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "optional", // Changed from "swap" for faster load
  preload: true,
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "optional", // Changed from "swap" for faster load
  preload: true,
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
});

export const metadata: Metadata = {
  title: "VerifyNIN | Fast NIN Verification for Banking, Education & More",
  description:
    "Verify your NIN instantly for banking, JAMB, passport, employment and more. Official NIMC verification in minutes. Secure, affordable, 24/7 available. Only ₦500 per verification.",
  keywords: [
    "NIN verification Nigeria",
    "verify NIN online",
    "NIN verification for bank account",
    "NIN verification for JAMB",
    "NIN verification for passport",
    "NIMC verification",
    "instant NIN verification",
    "NIN verification service",
  ],
  authors: [{ name: "VerifyNIN" }],
  creator: "VerifyNIN",
  publisher: "VerifyNIN",
  metadataBase: new URL("https://verifynin.ng"),
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://verifynin.ng",
    title: "VerifyNIN | Fast NIN Verification for Banking, Education & More",
    description:
      "Verify your NIN instantly for banking, education, travel, and more. Official NIMC verification in minutes.",
    siteName: "VerifyNIN",
  },
  twitter: {
    card: "summary_large_image",
    title: "VerifyNIN | Fast NIN Verification for Banking, Education & More",
    description:
      "Verify your NIN instantly for banking, education, travel, and more. Official NIMC verification in minutes.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="icon" href="/icon" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-icon" sizes="180x180" />

        {/* Font preconnect for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
