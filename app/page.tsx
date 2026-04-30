import { LandingNav } from "@/components/landing/nav"
import { Hero } from "@/components/landing/hero"
import { StatsBar } from "@/components/landing/stats-bar"
import { IntelligenceSection } from "@/components/landing/intelligence"
import { FeaturesSection } from "@/components/landing/features"
import { EmbedSection } from "@/components/landing/embed-section"
import { GatewaySection } from "@/components/landing/gateway-section"
import { PrivacySection } from "@/components/landing/privacy-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { CtaSection } from "@/components/landing/cta-section"
import { LandingFooter } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <div style={{ background: "#080a0b", minHeight: "100vh" }}>
      <LandingNav />
      <Hero />
      <StatsBar />
      <IntelligenceSection />
      <FeaturesSection />
      <EmbedSection />
      <GatewaySection />
      <PrivacySection />
      <PricingSection />
      <CtaSection />
      <LandingFooter />
    </div>
  )
}
