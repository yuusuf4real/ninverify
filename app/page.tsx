"use client";

import { useState, Suspense } from "react";
import { HeroSection } from "@/components/sections/hero-section";
import { HowItWorksSection } from "@/components/sections/how-it-works";
import { FooterSection } from "@/components/sections/footer-section";
import { VerificationFlow } from "@/components/verification/verification-flow";

export default function HomePage() {
  const [showVerification, setShowVerification] = useState(false);

  const handleStartVerification = () => {
    setShowVerification(true);
  };

  const handleBackToHome = () => {
    setShowVerification(false);
  };

  if (showVerification) {
    return (
      <main className="relative">
        <Suspense
          fallback={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          }
        >
          <VerificationFlow onComplete={handleBackToHome} />
        </Suspense>
      </main>
    );
  }

  return (
    <main className="relative">
      <HeroSection onStartVerification={handleStartVerification} />
      <HowItWorksSection />
      <FooterSection />
    </main>
  );
}
