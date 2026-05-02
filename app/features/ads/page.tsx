"use client"
import Link from "next/link"
import { useScrollReveal } from "@/components/landing/hooks/use-scroll-reveal"
import { AdManagerMockup } from "@/components/landing/mockups/ad-manager-mockup"
import { IntelligenceMockup } from "@/components/landing/mockups/intelligence-mockup"

const AD_TYPES = [
  {
    icon: "M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.899L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z",
    name: "Pre-article video",
    desc: "Plays before content loads. Readers can skip after 5 seconds or watch to completion for instant access.",
    color: "#27adb0",
  },
  {
    icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
    name: "Sidebar display",
    desc: "Banner or rich media alongside the article. Loads asynchronously — never blocks content rendering.",
    color: "#6366f1",
  },
  {
    icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
    name: "Mobile pre-roll",
    desc: "Full-screen interstitial on mobile. Fires between article sections, not on the first load.",
    color: "#c4820a",
  },
]

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Connect Google AdSense",
    desc: "Add your publisher ID in one step. OnePaywall handles the ad tag injection — no separate ad server setup required.",
    color: "#27adb0",
  },
  {
    step: "2",
    title: "Assign to gate fallback",
    desc: "Choose which gate steps fall back to an ad. When a reader skips the paywall, they see the ad instead. Revenue either way.",
    color: "#6366f1",
  },
  {
    step: "3",
    title: "Track performance",
    desc: "Impressions, completion rate, skip rate, and fill rate per unit — broken down by reader segment so you know which audiences engage.",
    color: "#22c55e",
  },
]

const STATS = [
  { label: "Average fill rate", value: "88%", sub: "across AdSense publisher accounts" },
  { label: "Completion vs paywall", value: "3×", sub: "more ad completions than paywall conversions" },
  { label: "Revenue per reader", value: "+34%", sub: "lift vs paywall-only monetisation" },
]

export default function AdsPage() {
  const heroRef = useScrollReveal<HTMLDivElement>()
  const statsRef = useScrollReveal<HTMLDivElement>()
  const howRef = useScrollReveal<HTMLDivElement>()
  const typesRef = useScrollReveal<HTMLDivElement>()
  const segRef = useScrollReveal<HTMLDivElement>()
  const ctaRef = useScrollReveal<HTMLDivElement>()

  return (
    <>
      {/* Hero */}
      <section style={{ background: "#fff", paddingTop: 120, paddingBottom: 80, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 60% at 80% 0%, rgba(39,173,176,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="lp-container">
          <div ref={heroRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
              Ad Management
            </div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, color: "var(--color-text)", margin: "0 0 20px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Ad revenue from every reader
              <br />
              <span className="lp-gradient-text">who won&apos;t pay.</span>
            </h1>
            <p style={{ fontSize: 18, color: "var(--color-text-secondary)", maxWidth: 560, margin: "0 auto", lineHeight: 1.65 }}>
              OnePaywall serves Google AdSense ads as a fallback when readers skip your paywall. Pre-roll video or display — all tracked per unit and per reader segment, with fill rate and completion analytics in one dashboard.
            </p>
          </div>
          <div className="lp-reveal-scale" style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ perspective: "1200px" }}>
              <div style={{ transform: "rotateX(4deg) rotateY(-3deg)", boxShadow: "0 40px 80px rgba(0,0,0,0.12), 0 0 0 1px var(--color-border)", borderRadius: 12 }}>
                <AdManagerMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ background: "var(--color-surface)", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)", padding: "40px 0" }}>
        <div className="lp-container">
          <div ref={statsRef} className="lp-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
            {STATS.map((s, i) => (
              <div key={s.label} style={{ textAlign: "center", padding: "0 24px", borderRight: i < STATS.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                <div style={{ fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em" }} className="lp-gradient-text">{s.value}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", marginTop: 4 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="lp-section" style={{ background: "#fff" }}>
        <div className="lp-container">
          <div ref={howRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Setup in 3 steps</div>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, color: "var(--color-text)", margin: 0, letterSpacing: "-0.02em" }}>
              Live in under 5 minutes.
            </h2>
          </div>
          <div className="lp-stagger lp-grid-3">
            {HOW_IT_WORKS.map(step => (
              <div key={step.step} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: step.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{step.step}</span>
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: "0 0 8px" }}>{step.title}</h3>
                  <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ad unit types */}
      <section className="lp-section" style={{ background: "var(--color-surface)" }}>
        <div className="lp-container">
          <div ref={typesRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Ad Unit Types</div>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, color: "var(--color-text)", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              Three formats. One integration.
            </h2>
            <p style={{ fontSize: 16, color: "var(--color-text-secondary)", maxWidth: 500, margin: "0 auto", lineHeight: 1.65 }}>
              All units served through your AdSense account. OnePaywall picks the right format based on device type and reading context.
            </p>
          </div>
          <div className="lp-stagger lp-grid-3">
            {AD_TYPES.map(t => (
              <div key={t.name} className="motion-lift" style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 12, padding: "28px 24px" }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: `${t.color}14`, border: `1px solid ${t.color}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={t.icon} />
                  </svg>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text)", margin: "0 0 10px" }}>{t.name}</h3>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.65, margin: 0 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Segment-aware ads */}
      <section className="lp-section" style={{ background: "#fff" }}>
        <div className="lp-container">
          <div className="lp-gateway-grid">
            <div ref={segRef} className="lp-reveal-left">
              <div style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Reader-aware serving</div>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, color: "var(--color-text)", margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                Show ads only to readers who won&apos;t convert.
              </h2>
              <p style={{ fontSize: 16, color: "var(--color-text-secondary)", lineHeight: 1.7, margin: "0 0 28px" }}>
                OnePaywall knows each reader&apos;s monetisation probability before any gate fires. Readers with a high conversion score see the paywall. Readers unlikely to pay see an ad instead. You earn either way — without burning subscription-ready readers on ad impressions.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { segment: "power_user", action: "Paywall first", color: "#27adb0", note: "High conversion probability" },
                  { segment: "regular", action: "Paywall → Ad fallback", color: "#6366f1", note: "Medium probability" },
                  { segment: "casual", action: "Ad gate", color: "#c4820a", note: "Lower conversion likelihood" },
                  { segment: "new", action: "Free pass", color: "#22c55e", note: "Build habit before monetising" },
                ].map(row => (
                  <div key={row.segment} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "12px 16px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: row.color, borderRadius: 6, padding: "3px 8px", fontFamily: "monospace", flexShrink: 0 }}>{row.segment}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{row.action}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{row.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-reveal-right" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <IntelligenceMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Privacy callout */}
      <section style={{ background: "var(--color-surface)", padding: "48px 0", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
        <div className="lp-container" style={{ textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)", margin: "0 0 8px" }}>
            No third-party ad tracking scripts on your site.
          </p>
          <p style={{ fontSize: 15, color: "var(--color-text-secondary)", margin: 0 }}>
            AdSense tags are injected only at the gate — never on page load. Your readers&apos; browsing stays private.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-section" style={{ background: "var(--color-brand)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
          <div ref={ctaRef} className="lp-reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.03em" }}>
              Turn every skipped paywall into revenue.
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
