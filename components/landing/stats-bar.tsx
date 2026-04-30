"use client"
import { useState } from "react"
import { useScrollReveal } from "./hooks/use-scroll-reveal"
import { useCounter } from "./hooks/use-counter"

const STATS = [
  { raw: 38,   suffix: " ms",  label: "Gate decision time",       note: "p95 latency on the hot path" },
  { raw: 41,   suffix: "×",    label: "Avg. conversion lift",     note: "vs. static paywalls", decimals: 1 },
  { raw: 60,   suffix: "%+",   label: "Readers leave without paying", note: "opportunity you can capture" },
  { raw: 5,    suffix: " min", label: "Time to first gate",       note: "one script tag, any CMS" },
]

function StatItem({ raw, suffix, label, note, active, decimals }: typeof STATS[0] & { active: boolean }) {
  const value = useCounter(raw, 1400, active)
  const display = decimals ? (value / 10).toFixed(1) : value

  return (
    <div style={{ textAlign: "center", padding: "36px 24px" }}>
      <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        <span className="lp-gradient-text">{display}</span>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 32 }}>{suffix}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginTop: 10 }}>{label}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{note}</div>
    </div>
  )
}

export function StatsBar() {
  const [active, setActive] = useState(false)
  const ref = useScrollReveal<HTMLDivElement>(0.2)

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      className="lp-reveal"
      onAnimationEnd={() => setActive(true)}
      style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div
        className="lp-stagger"
        ref={(el) => {
          if (el && !active) {
            const obs = new IntersectionObserver(([entry]) => {
              if (entry.isIntersecting) { setActive(true); obs.disconnect() }
            }, { threshold: 0.3 })
            obs.observe(el)
          }
        }}
        style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", padding: "0 32px" }}
      >
        {STATS.map((s, i) => (
          <div key={s.label} style={{ borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
            <StatItem {...s} active={active} />
          </div>
        ))}
      </div>
    </section>
  )
}
