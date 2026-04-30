"use client"
import { useScrollReveal } from "./hooks/use-scroll-reveal"
import { RevenueMockup } from "./mockups/revenue-mockup"

const CARDS = [
  {
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    color: "#27adb0",
    glow: "rgba(39,173,176,0.12)",
    title: "Anonymous by default",
    body: "Readers are tracked via a SHA-256 fingerprint only. No name, no email, no IP stored for non-paying visitors.",
  },
  {
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    color: "#c4820a",
    glow: "rgba(196,130,10,0.12)",
    title: "Subscriber emails, handled right",
    body: "When a reader subscribes, we store an AES-256 encrypted email for magic-link restore and support only. Never sold, never shared.",
  },
  {
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.12)",
    title: "You own the intelligence",
    body: "Every signal, profile, and conversion insight belongs to your publisher account. Export anytime. Delete anytime. No lock-in.",
  },
  {
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "#6366f1",
    glow: "rgba(99,102,241,0.12)",
    title: "90-day raw signal retention",
    body: "Raw events auto-purge after 90 days. Aggregated rollups — the insights that matter — stay with you indefinitely.",
  },
]

export function PrivacySection() {
  const headRef = useScrollReveal<HTMLDivElement>()
  const cardsRef = useScrollReveal<HTMLDivElement>()
  const mockupRef = useScrollReveal<HTMLDivElement>()

  return (
    <section style={{ background: "#080a0b", padding: "120px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        {/* Heading */}
        <div ref={headRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 11, color: "#27adb0", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
            Privacy and data ownership
          </div>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, color: "#fff", margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Reader data stays{" "}
            <span className="lp-gradient-text">with you.</span>
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.45)", maxWidth: 520, margin: "0 auto", lineHeight: 1.65 }}>
            We collect only what we need to make gate decisions. Publishers own every bit of intelligence their readers generate.
          </p>
        </div>

        {/* Cards */}
        <div ref={cardsRef} className="lp-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 72 }}>
          {CARDS.map(card => (
            <div
              key={card.title}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "28px 24px", display: "flex", gap: 18 }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: card.glow, border: `1px solid ${card.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={card.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={card.icon} />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{card.title}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>{card.body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue mockup */}
        <div ref={mockupRef} className="lp-reveal-scale" style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative" }}>
            {/* Caption */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, padding: "4px 14px" }}>
                Your revenue ledger, in real time
              </span>
            </div>
            <RevenueMockup />
          </div>
        </div>
      </div>
    </section>
  )
}
