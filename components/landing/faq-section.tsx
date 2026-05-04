"use client"
import { useState } from "react"
import { useScrollReveal } from "./hooks/use-scroll-reveal"

const FAQS = [
  {
    q: "How is OnePaywall different from a paywall plugin?",
    a: "Most plugins show the same gate to every reader. OnePaywall builds a real-time reader profile and selects the gate most likely to convert — subscription, ad, unlock, or free pass. The result is 4× more revenue without the subscriber dropoff.",
  },
  {
    q: "Does it work with WordPress, Ghost, Webflow, and other CMSes?",
    a: "Yes. OnePaywall is a single JavaScript snippet — no plugin, no rebuild, no CMS-specific integration. If a page can run a script tag, OnePaywall works on it.",
  },
  {
    q: "Do my readers need to create accounts?",
    a: "No. OnePaywall fingerprints anonymous readers using browser signals — no login, no cookies, no PII collected for anonymous visitors. Paid subscribers can optionally restore access via email magic link.",
  },
  {
    q: "How does the reader profiling work without cookies?",
    a: "We combine browser fingerprinting, behavioral signals (scroll depth, visit frequency, time on page), and session context to build an anonymous engagement profile. No personal data is stored for anonymous readers.",
  },
  {
    q: "What payment gateways are supported?",
    a: "Razorpay is supported today, with Stripe and Paddle on the roadmap. Publishers can use their own gateway credentials or OnePaywall's platform keys.",
  },
  {
    q: "Is it GDPR and CCPA compliant?",
    a: "Yes. Anonymous reader profiles contain zero PII. Raw behavioral signals are hard-deleted after 90 days. For paid subscribers, only a normalized email hash is stored — never raw email addresses in plaintext.",
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ borderBottom: "1px solid var(--color-border)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 0",
          gap: 16,
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)", lineHeight: 1.4 }}>{q}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-text-secondary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            transition: "transform 0.2s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div style={{ paddingBottom: 20, paddingRight: 32 }}>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0 }}>{a}</p>
        </div>
      )}
    </div>
  )
}

export function FaqSection() {
  const headRef = useScrollReveal<HTMLDivElement>()
  const listRef = useScrollReveal<HTMLDivElement>()

  return (
    <section className="lp-section" style={{ background: "#fff" }}>
      <div className="lp-container" style={{ maxWidth: 760 }}>
        <div ref={headRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
            FAQ
          </div>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, color: "var(--color-text)", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Questions publishers ask
          </h2>
        </div>

        <div ref={listRef} className="lp-stagger" style={{ borderTop: "1px solid var(--color-border)" }}>
          {FAQS.map(item => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </section>
  )
}
