"use client"
import Link from "next/link"
import { useState } from "react"
import { useScrollReveal } from "./hooks/use-scroll-reveal"

const PLANS = [
  {
    name: "Starter",
    desc: "For publishers getting started with intelligent gating.",
    price: null,
    readers: "Up to 10K readers / mo",
    highlight: false,
    cta: "Join early access",
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
    cta: "Get started free",
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
    cta: "Join early access",
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
    <section id="pricing" className="lp-section" style={{ background: "var(--color-surface)" }}>
      <div className="lp-container">
        {/* Heading */}
        <div ref={headRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
            Transparent pricing
          </div>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, color: "var(--color-text)", margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Pricing that scales with your readers,
            <br />
            not your revenue.
          </h2>
          <p style={{ fontSize: 17, color: "var(--color-text-secondary)", maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.65 }}>
            Every plan includes a 14-day free trial. No credit card required to start.
          </p>

          {/* Toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--color-surface-hover)", border: "1px solid var(--color-border)", borderRadius: 100, padding: "4px 6px" }}>
            <button
              onClick={() => setAnnual(false)}
              style={{ background: !annual ? "#fff" : "transparent", color: !annual ? "var(--color-text)" : "var(--color-text-secondary)", border: !annual ? "1px solid var(--color-border)" : "1px solid transparent", borderRadius: 100, padding: "6px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease" }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              style={{ background: annual ? "#fff" : "transparent", color: annual ? "var(--color-text)" : "var(--color-text-secondary)", border: annual ? "1px solid var(--color-border)" : "1px solid transparent", borderRadius: 100, padding: "6px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: 6 }}
            >
              Annual
              <span style={{ fontSize: 10, background: "var(--color-brand)", color: "#fff", padding: "1px 6px", borderRadius: 100, fontWeight: 700 }}>
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Scarcity line */}
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--color-brand)", fontWeight: 600, marginBottom: 24, marginTop: 8 }}>
          Founding publisher spots are limited. Early access members lock in the lowest price forever.
        </p>

        {/* Plan cards */}
        <div ref={cardsRef} className="lp-stagger lp-grid-3">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              style={{
                background: "#fff",
                border: `1px solid ${plan.highlight ? "var(--color-brand)" : "var(--color-border)"}`,
                borderRadius: 16,
                padding: "32px 28px",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                boxShadow: plan.highlight ? "0 0 0 4px rgba(39,173,176,0.08)" : "none",
              }}
            >
              {plan.highlight && (
                <div style={{ position: "absolute", top: -1, left: 0, right: 0, height: 3, background: "var(--color-brand)", borderRadius: "16px 16px 0 0" }} />
              )}
              {plan.highlight && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 11, background: "var(--color-brand)", color: "#fff", padding: "4px 14px", borderRadius: 100, fontWeight: 700, whiteSpace: "nowrap" }}>
                  Most popular
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text)", marginBottom: 6 }}>{plan.name}</div>
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{plan.desc}</div>
              </div>

              {/* Price placeholder */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: plan.highlight ? "var(--color-brand)" : "var(--color-text)", letterSpacing: "-0.03em" }}>
                  Free to join
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>Founding publisher pricing locked in at GA</div>
              </div>

              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 24, background: "var(--color-surface)", borderRadius: 8, padding: "6px 10px", display: "inline-block", border: "1px solid var(--color-border)" }}>
                {plan.readers}
              </div>

              {/* Features */}
              <div style={{ display: "flex", flexDirection: "column", gap: 11, flex: 1 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? "var(--color-brand)" : "var(--color-text-secondary)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span style={{ fontSize: 13, color: "var(--color-text)" }}>{f}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/register"
                className={plan.highlight ? "lp-btn-primary" : "lp-btn-ghost-light"}
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
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
            In early access: all features unlocked, no billing until GA. No credit card required.
          </p>
        </div>
      </div>
    </section>
  )
}
