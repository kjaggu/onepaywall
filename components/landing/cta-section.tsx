"use client"
import Link from "next/link"
import { useScrollReveal } from "./hooks/use-scroll-reveal"

export function CtaSection() {
  const ref = useScrollReveal<HTMLDivElement>()

  return (
    <section className="lp-section" style={{ background: "#080a0b" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
        <div ref={ref} className="lp-reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          {/* Glowing orb behind */}
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(39,173,176,0.14) 0%, transparent 70%)", pointerEvents: "none", animation: "lp-glow-pulse 4s ease-in-out infinite" }} />

          <div style={{ position: "relative" }}>
            <h2 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Start turning readers
              <br />
              into{" "}
              <span className="lp-gradient-text">revenue.</span>
            </h2>
          </div>

          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.65 }}>
            14-day free trial. No credit card. Cancel anytime.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link
              href="/register"
              className="lp-btn-primary"
              style={{ padding: "16px 36px", fontSize: 16, fontWeight: 800, textDecoration: "none", display: "inline-block", borderRadius: 12, letterSpacing: "-0.01em" }}
            >
              Create your account
            </Link>
            <Link
              href="/login"
              style={{ padding: "16px 24px", fontSize: 15, color: "rgba(255,255,255,0.4)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            >
              Already have an account? Sign in
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>

          {/* Trust signals */}
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
            {["No credit card required", "Cancel anytime", "Data never sold"].map(signal => (
              <div key={signal} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#27adb0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>{signal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
