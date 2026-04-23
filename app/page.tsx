"use client";

import { useState } from "react";
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
        <VerificationFlow onComplete={handleBackToHome} />
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
