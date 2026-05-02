import { LandingNav } from "@/components/landing/nav"
import { Hero } from "@/components/landing/hero"
import { StatsBar } from "@/components/landing/stats-bar"
import { FeaturesSection } from "@/components/landing/features"
import { EmbedSection } from "@/components/landing/embed-section"
import { PricingSection } from "@/components/landing/pricing-section"
import { CtaSection } from "@/components/landing/cta-section"
import { LandingFooter } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <LandingNav />
      <Hero />
      <StatsBar />
      <FeaturesSection />
      <EmbedSection />
      <PricingSection />
      <CtaSection />
      <LandingFooter />
    </div>
  )
}
