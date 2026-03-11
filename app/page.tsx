import { HeroSection } from "@/components/sections/hero-section";
import { UseCasesSection } from "@/components/sections/use-cases-section";
import { FeaturesSection } from "@/components/sections/features-section";
import { PartnersSection } from "@/components/sections/partners-section";
import { HowItWorksSection } from "@/components/sections/how-it-works";
import { SecuritySection } from "@/components/sections/security-section";
import { CTASection } from "@/components/sections/cta-section";
import { FooterSection } from "@/components/sections/footer-section";

export default function HomePage() {
  return (
    <main className="relative">
      <HeroSection />
      <UseCasesSection />
      <FeaturesSection />
      <PartnersSection />
      <HowItWorksSection />
      <SecuritySection />
      <CTASection />
      <FooterSection />
    </main>
  );
}
