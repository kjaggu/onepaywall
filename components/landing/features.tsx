"use client"
import Link from "next/link"
import { useScrollReveal } from "./hooks/use-scroll-reveal"

const FEATURES = [
  {
    icon: "M8 9l4-4 4 4m0 6l-4 4-4-4",
    title: "Adaptive Gates",
    body: "Six gate types — ad, subscription, pay-to-unlock, lead capture, digital product, newsletter — each with smart triggers based on visit count, device, and reader segment. Build multi-step sequences or use a template and go live in minutes.",
    href: "/features/gates",
  },
  {
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    title: "Reader Intelligence",
    body: "Every anonymous visitor gets a live profile: engagement score, monetisation probability (0–1), segment (new / casual / regular / power user), and topic interests across 10 categories. No PII required.",
    href: "/features/intelligence",
  },
  {
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    title: "Full Analytics Suite",
    body: "Gate analytics with hourly conversion charts, a content dashboard that replaces basic GA, audience segmentation, and ad impression/completion/skip tracking — all in one place.",
    href: "/features/analytics",
  },
  {
    icon: "M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.899L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z",
    title: "Ad Management",
    body: "Serve Google AdSense ads as a paywall fallback. Pre-roll video and display units tracked by impression, completion, fill rate, and reader segment — so you earn from every reader, not just subscribers.",
    href: "/features/ads",
  },
  {
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    title: "Email & CRM",
    body: "Send campaigns segmented by reader behaviour, or trigger automations on events like new subscriber, segment change, or ad engagement. Native Mailchimp, ConvertKit, and Zapier webhooks included.",
    href: "/features/email",
  },
]

export function FeaturesSection() {
  const headRef = useScrollReveal<HTMLDivElement>()
  const gridRef = useScrollReveal<HTMLDivElement>()

  return (
    <section id="features" className="lp-section" style={{ background: "#fff" }}>
      <div className="lp-container">
        <div ref={headRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
            Built for publishers
          </div>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, color: "var(--color-text)", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Everything you need to{" "}
            <span className="lp-gradient-text">monetise intelligently.</span>
          </h2>
        </div>

        <div ref={gridRef} className="lp-stagger lp-features-grid">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className="motion-lift"
              style={{
                background: "#fff",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 0,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 11,
                background: "rgba(39,173,176,0.08)",
                border: "1px solid rgba(39,173,176,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 18, flexShrink: 0,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.icon} />
                </svg>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", margin: "0 0 10px", letterSpacing: "-0.01em" }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.65, margin: "0 0 20px", flex: 1 }}>
                {f.body}
              </p>

              <Link
                href={f.href}
                style={{
                  fontSize: 13, fontWeight: 600, color: "var(--color-brand)",
                  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
                  transition: "gap 0.15s ease",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.gap = "8px" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.gap = "4px" }}
              >
                Learn more
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
