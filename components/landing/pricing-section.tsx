"use client"
import Link from "next/link"
import { useState } from "react"
import { useScrollReveal } from "./hooks/use-scroll-reveal"

// [TBD] — actual pricing to be confirmed before launch
const PLANS = [
  {
    name: "Starter",
    desc: "For publishers getting started with intelligent gating.",
    price: null,
    readers: "Up to 10K readers / mo",
    highlight: false,
    features: [
      "1 domain",
      "All gate types (paywall, ad, free pass)",
      "Basic analytics dashboard",
      "Reader fingerprinting",
      "Embed snippet",
    ],
  },
  {
    name: "Growth",
    desc: "For publishers ready to scale reader monetisation.",
    price: null,
    readers: "Up to 250K readers / mo",
    highlight: true,
    features: [
      "Up to 10 domains",
      "Everything in Starter",
      "Reader intelligence profiles",
      "Bring your own PG keys",
      "Revenue export (CSV)",
      "Priority support",
    ],
  },
  {
    name: "Scale",
    desc: "For large publications and media companies.",
    price: null,
    readers: "Unlimited readers",
    highlight: false,
    features: [
      "Unlimited domains",
      "Everything in Growth",
      "Dedicated onboarding",
      "Custom SLA and uptime guarantee",
      "Team members and roles",
    ],
  },
]

export function PricingSection() {
  const [annual, setAnnual] = useState(false)
  const headRef = useScrollReveal<HTMLDivElement>()
  const cardsRef = useScrollReveal<HTMLDivElement>()

  return (
    <section style={{ background: "#06080a", padding: "120px 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px" }}>
        {/* Heading */}
        <div ref={headRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, color: "#27adb0", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
            Transparent pricing
          </div>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, color: "#fff", margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Pricing that scales with your readers,
            <br />
            not your revenue.
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.4)", maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.65 }}>
            Every plan includes a 14-day free trial. No credit card required to start.
          </p>

          {/* Toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, padding: "4px 6px" }}>
            <button
              onClick={() => setAnnual(false)}
              style={{ background: !annual ? "#fff" : "transparent", color: !annual ? "#111" : "rgba(255,255,255,0.4)", border: "none", borderRadius: 100, padding: "6px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease" }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              style={{ background: annual ? "#fff" : "transparent", color: annual ? "#111" : "rgba(255,255,255,0.4)", border: "none", borderRadius: 100, padding: "6px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: 6 }}
            >
              Annual
              <span style={{ fontSize: 10, background: annual ? "#27adb0" : "rgba(39,173,176,0.2)", color: "#fff", padding: "1px 6px", borderRadius: 100, fontWeight: 700 }}>
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div ref={cardsRef} className="lp-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {PLANS.map(plan => (
            <div
              key={plan.name}
              style={{
                background: plan.highlight ? "rgba(39,173,176,0.06)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${plan.highlight ? "rgba(39,173,176,0.35)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 20,
                padding: "32px 28px",
                position: "relative",
                boxShadow: plan.highlight ? "0 0 60px rgba(39,173,176,0.12)" : "none",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {plan.highlight && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 11, background: "#27adb0", color: "#fff", padding: "4px 14px", borderRadius: 100, fontWeight: 700, whiteSpace: "nowrap" }}>
                  Most popular
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{plan.name}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{plan.desc}</div>
              </div>

              {/* Price placeholder */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: plan.highlight ? "#27adb0" : "rgba(255,255,255,0.6)", letterSpacing: "-0.03em" }}>
                  Early access
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>Pricing confirmed at GA</div>
              </div>

              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 24, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "6px 10px", display: "inline-block" }}>
                {plan.readers}
              </div>

              {/* Features */}
              <div style={{ display: "flex", flexDirection: "column", gap: 11, flex: 1 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? "#27adb0" : "rgba(255,255,255,0.35)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{f}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/register"
                className={plan.highlight ? "lp-btn-primary" : "lp-btn-ghost"}
                style={{
                  display: "block",
                  textAlign: "center",
                  marginTop: 28,
                  padding: "12px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Start free trial
              </Link>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", margin: 0 }}>
            All plans include a 14-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  )
}
