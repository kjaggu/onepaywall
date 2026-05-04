"use client"
import Link from "next/link"
import { useScrollReveal } from "./hooks/use-scroll-reveal"

export function CtaSection() {
  const ref = useScrollReveal<HTMLDivElement>()

  return (
    <section className="lp-section" style={{ background: "var(--color-brand)" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
        <div ref={ref} className="lp-reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          <h2 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Your readers are ready.
            <br />
            Are{" "}
            <span className="lp-gradient-text-white">you?</span>
          </h2>

          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.75)", margin: 0, lineHeight: 1.65 }}>
            Join publishers already earning more with adaptive gates. No credit card, no commitment — live in 5 minutes.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link
              href="/register"
              style={{
                padding: "16px 36px",
                fontSize: 16,
                fontWeight: 800,
                textDecoration: "none",
                display: "inline-block",
                borderRadius: 12,
                letterSpacing: "-0.01em",
                background: "#fff",
                color: "var(--color-brand)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"
                ;(e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)"
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)"
                ;(e.currentTarget as HTMLElement).style.boxShadow = "none"
              }}
            >
              Get started free →
            </Link>
            <Link
              href="/login"
              style={{ padding: "16px 24px", fontSize: 15, color: "rgba(255,255,255,0.75)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
            >
              Already have an account? Sign in
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {/* Trust signals */}
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap", justifyContent: "center" }}>
            {["No credit card required", "Cancel anytime", "Trusted by publishers in 12+ countries"].map(signal => (
              <div key={signal} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{signal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
