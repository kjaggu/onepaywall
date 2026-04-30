"use client"
import { useRef, useCallback } from "react"
import { useScrollReveal } from "./hooks/use-scroll-reveal"

const FEATURES = [
  {
    icon: "M8 9l4-4 4 4m0 6l-4 4-4-4",
    title: "Smart Gate Selection",
    body: "Paywall, metered access, ad gate, or free pass — routed per reader, not per article. OnePaywall reads the signal and picks the gate most likely to convert.",
    bullets: ["Priority-ordered gate rules", "URL glob and device targeting", "Unlock-once, subscribe-always"],
    accent: "#27adb0",
    glow: "rgba(39,173,176,0.15)",
  },
  {
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    title: "Revenue Analytics",
    body: "See exactly what each gate earns, which domains convert best, and where you are leaving money on the table. Data is yours to export.",
    bullets: ["Per-gate, per-domain revenue", "Conversion funnel breakdown", "7 / 30 / 90-day range filters"],
    accent: "#22c55e",
    glow: "rgba(34,197,94,0.15)",
  },
  {
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    title: "Reader Intelligence",
    body: "We track scroll depth, read time, device type, and referral source, building a value profile for every anonymous fingerprint. No PII involved.",
    bullets: ["SHA-256 anonymous fingerprint", "Scroll depth and read time signals", "Return visitor detection"],
    accent: "#c4820a",
    glow: "rgba(196,130,10,0.15)",
  },
]

function FeatureCard({ feature }: { feature: typeof FEATURES[0] }) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / (rect.width / 2)
    const dy = (e.clientY - cy) / (rect.height / 2)
    card.style.transform = `perspective(800px) rotateX(${-dy * 6}deg) rotateY(${dx * 6}deg) translateZ(8px)`
    card.style.boxShadow = `0 20px 60px rgba(0,0,0,0.4), 0 0 40px ${feature.glow}`
  }, [feature.glow])

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = "perspective(800px) rotateX(0) rotateY(0) translateZ(0)"
    card.style.boxShadow = "none"
  }, [])

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="lp-tilt-card"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: "32px 28px",
        cursor: "default",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
      }}
    >
      {/* Icon */}
      <div style={{ width: 48, height: 48, borderRadius: 13, background: `${feature.glow}`, border: `1px solid ${feature.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={feature.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={feature.icon} />
        </svg>
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.02em" }}>{feature.title}</h3>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, margin: "0 0 20px" }}>{feature.body}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {feature.bullets.map(b => (
          <div key={b} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: feature.accent, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{b}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FeaturesSection() {
  const headRef = useScrollReveal<HTMLDivElement>()
  const gridRef = useScrollReveal<HTMLDivElement>()

  return (
    <section style={{ background: "#06080a", padding: "120px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        <div ref={headRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 11, color: "#27adb0", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
            Built for publishers
          </div>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Everything you need to{" "}
            <span className="lp-gradient-text">monetise intelligently.</span>
          </h2>
        </div>

        <div ref={gridRef} className="lp-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {FEATURES.map(f => <FeatureCard key={f.title} feature={f} />)}
        </div>
      </div>
    </section>
  )
}
