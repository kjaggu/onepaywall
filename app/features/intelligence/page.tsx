"use client"
import Link from "next/link"
import { useScrollReveal } from "@/components/landing/hooks/use-scroll-reveal"
import { IntelligenceMockup } from "@/components/landing/mockups/intelligence-mockup"
import { RevenueMockup } from "@/components/landing/mockups/revenue-mockup"

const PROFILE_FIELDS = [
  { label: "Engagement Score", value: "0–100", desc: "Weighted read time + scroll depth with time decay", color: "#27adb0" },
  { label: "Monetisation Probability", value: "0.00–1.00", desc: "ML-derived likelihood to convert to a paying reader", color: "#22c55e" },
  { label: "Reader Segment", value: "4 tiers", desc: "new / casual / regular / power_user — auto-classified", color: "#6366f1" },
  { label: "Topic Interests", value: "10 categories", desc: "Finance, Tech, Sports, Health, and 6 more — inferred from reading history", color: "#c4820a" },
]

const BEFORE = [
  "Same paywall for every reader, every visit",
  "No fallback when readers refuse to pay",
  "Zero signal on who actually converts",
  "Revenue left on the table every hour",
  "No visibility into what your content earns",
]

const AFTER = [
  "Gate type chosen per reader in real time",
  "Ad gate or free pass when paywall won't land",
  "Full read-time, scroll-depth, and return-rate data",
  "Every reader interaction turns into signal",
  "Per-domain, per-gate revenue attribution",
]

const PRIVACY = [
  { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", text: "SHA-256 fingerprint only — no IP, no cookies, no name" },
  { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", text: "Subscriber emails stored AES-256 encrypted, never sold" },
  { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", text: "You own every signal, profile, and insight — export anytime" },
  { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", text: "Raw signals auto-purged after 90 days. Rollups kept indefinitely." },
]

export default function IntelligencePage() {
  const heroRef = useScrollReveal<HTMLDivElement>()
  const fieldsRef = useScrollReveal<HTMLDivElement>()
  const baRef = useScrollReveal<HTMLDivElement>()
  const privacyHeadRef = useScrollReveal<HTMLDivElement>()
  const privacyRef = useScrollReveal<HTMLDivElement>()
  const ctaRef = useScrollReveal<HTMLDivElement>()

  return (
    <>
      {/* Hero */}
      <section style={{ background: "#fff", paddingTop: 120, paddingBottom: 80, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 60% at 80% 0%, rgba(39,173,176,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="lp-container">
          <div ref={heroRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
              Reader Intelligence
            </div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, color: "var(--color-text)", margin: "0 0 20px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Know which readers will pay
              <br />
              <span className="lp-gradient-text">before you ask.</span>
            </h1>
            <p style={{ fontSize: 18, color: "var(--color-text-secondary)", maxWidth: 560, margin: "0 auto", lineHeight: 1.65 }}>
              OnePaywall builds a live intelligence profile for every anonymous visitor using scroll depth, read time, device, referral, return frequency, and topic affinity. No PII. No cookies. No compliance headache.
            </p>
          </div>

          <div className="lp-reveal-scale" style={{ display: "flex", justifyContent: "center" }}>
            <IntelligenceMockup />
          </div>
        </div>
      </section>

      {/* Profile fields */}
      <section className="lp-section" style={{ background: "var(--color-surface)" }}>
        <div className="lp-container">
          <div ref={fieldsRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, color: "var(--color-text)", margin: 0, letterSpacing: "-0.02em" }}>
              Four data points. One complete picture.
            </h2>
          </div>
          <div className="lp-stagger lp-grid-4">
            {PROFILE_FIELDS.map(f => (
              <div key={f.label} className="motion-lift" style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 12, padding: "24px 20px" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: f.color, letterSpacing: "-0.03em", marginBottom: 8 }}>{f.value}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>{f.label}</div>
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="lp-section" style={{ background: "#fff" }}>
        <div className="lp-container">
          <div ref={baRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>The monetisation gap</div>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, color: "var(--color-text)", margin: 0, letterSpacing: "-0.02em" }}>
              A payment button is not a strategy.
            </h2>
          </div>
          <div className="lp-stagger lp-intelligence-grid">
            <div style={{ background: "rgba(192,57,43,0.04)", border: "1px solid rgba(192,57,43,0.15)", borderRadius: 16, padding: "28px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c0392b", marginBottom: 20 }}>Before OnePaywall</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {BEFORE.map(text => (
                  <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    <span style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-intelligence-arrow" style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
            <div style={{ background: "rgba(39,173,176,0.05)", border: "1px solid rgba(39,173,176,0.2)", borderRadius: 16, padding: "28px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-brand)", marginBottom: 20 }}>With OnePaywall</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {AFTER.map(text => (
                  <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span style={{ fontSize: 14, color: "var(--color-text)", lineHeight: 1.5 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy + revenue mockup */}
      <section className="lp-section" style={{ background: "var(--color-surface)" }}>
        <div className="lp-container">
          <div ref={privacyHeadRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Privacy and data ownership</div>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, color: "var(--color-text)", margin: 0, letterSpacing: "-0.02em" }}>
              Reader data stays{" "}
              <span className="lp-gradient-text">with you.</span>
            </h2>
          </div>
          <div ref={privacyRef} className="lp-stagger lp-grid-2-tight" style={{ marginBottom: 64 }}>
            {PRIVACY.map(p => (
              <div key={p.text} style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 12, padding: "22px 20px", display: "flex", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(39,173,176,0.08)", border: "1px solid rgba(39,173,176,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={p.icon} />
                  </svg>
                </div>
                <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.65, margin: 0, paddingTop: 4 }}>{p.text}</p>
              </div>
            ))}
          </div>
          <div className="lp-reveal-scale" style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 100, padding: "4px 14px" }}>
                  Your revenue ledger, in real time
                </span>
              </div>
              <RevenueMockup />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-section" style={{ background: "var(--color-brand)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
          <div ref={ctaRef} className="lp-reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.03em" }}>
              Start profiling your readers today.
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
