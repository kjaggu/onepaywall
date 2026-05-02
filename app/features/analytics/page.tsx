"use client"
import Link from "next/link"
import { useScrollReveal } from "@/components/landing/hooks/use-scroll-reveal"
import { AnalyticsMockup } from "@/components/landing/mockups/analytics-mockup"
import { IntelligenceMockup } from "@/components/landing/mockups/intelligence-mockup"
import { ContentAnalyticsMockup } from "@/components/landing/mockups/content-analytics-mockup"
import { AdManagerMockup } from "@/components/landing/mockups/ad-manager-mockup"

const DASHBOARDS = [
  {
    label: "Gate Analytics",
    headline: "See exactly what each gate earns.",
    body: "Hourly impression and conversion chart per gate. Per-domain breakdowns show which site drives the most paid unlocks. Spot drop-off at each step in a multi-step sequence.",
    mockup: "analytics",
    bullets: ["Hourly gate impressions vs. conversions", "Per-domain revenue attribution", "Step-level funnel for multi-step gates"],
  },
  {
    label: "Content Analytics",
    headline: "Replace your basic GA for content.",
    body: "Top articles by engaged sessions, full funnel from pageview → gate shown → conversion, and source attribution — organic, social, direct, referral. Quality-scored per source.",
    mockup: "content",
    bullets: ["Top content by view and read-depth", "Source attribution with quality scores", "Funnel: pageview → gate shown → conversion"],
  },
  {
    label: "Audience Analytics",
    headline: "Know who your readers actually are.",
    body: "Segment distribution (new / casual / regular / power_user), topic interest distribution across 10 categories, and visit frequency breakdown. All built from anonymous fingerprints.",
    mockup: "intelligence",
    bullets: ["Segment donut: new → power_user distribution", "Topic interest bar chart (10 categories)", "Visit frequency: one-time → daily"],
  },
  {
    label: "Ad Analytics",
    headline: "Measure your ad inventory performance.",
    body: "Impression counts, completion rate, skip rate, and fill rate per ad unit and per reader segment. Understand which reader types engage with your ad gates most.",
    mockup: "ad-manager",
    bullets: ["Per-unit: impressions, completion %, skip %", "Per-segment: which readers complete ads", "Fill rate % per network connection"],
  },
]

function MockupForKey({ mockup }: { mockup: string }) {
  if (mockup === "analytics") return <AnalyticsMockup />
  if (mockup === "content") return <ContentAnalyticsMockup />
  if (mockup === "intelligence") return <IntelligenceMockup />
  if (mockup === "ad-manager") return <AdManagerMockup />
  return null
}

export default function AnalyticsPage() {
  const heroRef = useScrollReveal<HTMLDivElement>()
  const ctaRef = useScrollReveal<HTMLDivElement>()
  const sectionRefs = [
    useScrollReveal<HTMLDivElement>(),
    useScrollReveal<HTMLDivElement>(),
    useScrollReveal<HTMLDivElement>(),
    useScrollReveal<HTMLDivElement>(),
  ]

  return (
    <>
      {/* Hero */}
      <section style={{ background: "#fff", paddingTop: 120, paddingBottom: 80, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 60% at 80% 0%, rgba(39,173,176,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="lp-container">
          <div ref={heroRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
              Analytics Suite
            </div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, color: "var(--color-text)", margin: "0 0 20px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Four dashboards.
              <br />
              <span className="lp-gradient-text">Every signal that matters.</span>
            </h1>
            <p style={{ fontSize: 18, color: "var(--color-text-secondary)", maxWidth: 560, margin: "0 auto", lineHeight: 1.65 }}>
              Gate conversion, content performance, audience distribution, and ad analytics — all built from the same reader events, without any third-party tracking script.
            </p>
          </div>
          <div className="lp-reveal-scale" style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ perspective: "1200px" }}>
              <div style={{ transform: "rotateX(4deg) rotateY(-3deg)", boxShadow: "0 40px 80px rgba(0,0,0,0.12), 0 0 0 1px var(--color-border)", borderRadius: 12 }}>
                <AnalyticsMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard sections — alternating layout */}
      {DASHBOARDS.map((d, i) => (
        <section
          key={d.label}
          className="lp-section"
          style={{ background: i % 2 === 0 ? "var(--color-surface)" : "#fff" }}
        >
          <div className="lp-container">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
              {i % 2 === 0 ? (
                <>
                  <div ref={sectionRefs[i]} className="lp-reveal-left" style={{ display: "flex", justifyContent: "center" }}>
                    <MockupForKey mockup={d.mockup} />
                  </div>
                  <div className="lp-reveal-right">
                    <div style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>{d.label}</div>
                    <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--color-text)", margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{d.headline}</h2>
                    <p style={{ fontSize: 16, color: "var(--color-text-secondary)", lineHeight: 1.7, margin: "0 0 24px" }}>{d.body}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {d.bullets.map(b => (
                        <div key={b} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          <span style={{ fontSize: 14, color: "var(--color-text)" }}>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="lp-reveal-left">
                    <div style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>{d.label}</div>
                    <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "var(--color-text)", margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{d.headline}</h2>
                    <p style={{ fontSize: 16, color: "var(--color-text-secondary)", lineHeight: 1.7, margin: "0 0 24px" }}>{d.body}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {d.bullets.map(b => (
                        <div key={b} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          <span style={{ fontSize: 14, color: "var(--color-text)" }}>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div ref={sectionRefs[i]} className="lp-reveal-right" style={{ display: "flex", justifyContent: "center" }}>
                    <MockupForKey mockup={d.mockup} />
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      ))}

      {/* Export callout */}
      <section style={{ background: "var(--color-surface)", padding: "48px 0", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
        <div className="lp-container" style={{ textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", margin: "0 0 8px" }}>
            All analytics data is yours to export as CSV.
          </p>
          <p style={{ fontSize: 15, color: "var(--color-text-secondary)", margin: 0 }}>No proprietary lock-in. No per-export fee.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-section" style={{ background: "var(--color-brand)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
          <div ref={ctaRef} className="lp-reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.03em" }}>
              See your readers clearly.
            </h2>
            <Link href="/register" style={{ background: "#fff", color: "var(--color-brand)", padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 800, textDecoration: "none" }}>
              Start free trial
            </Link>
            <Link href="/login" style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}>
              Already have an account? Sign in →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
