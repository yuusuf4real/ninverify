import { HeroSection } from "@/components/sections/hero-section";
import { HowItWorksSection } from "@/components/sections/how-it-works";
import { SimplifiedCTASection } from "@/components/sections/simplified-cta-section";
import { FooterSection } from "@/components/sections/footer-section";

export default function HomePage() {
  return (
    <main className="relative">
      <HeroSection />
      <HowItWorksSection />
      <SimplifiedCTASection />
      <FooterSection />
    </main>
  );
}
