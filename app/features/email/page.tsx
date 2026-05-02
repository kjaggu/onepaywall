"use client"
import Link from "next/link"
import { useScrollReveal } from "@/components/landing/hooks/use-scroll-reveal"
import { EmailCampaignMockup } from "@/components/landing/mockups/email-campaign-mockup"

const FEATURES = [
  {
    icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
    title: "Campaigns",
    desc: "One-time broadcasts. Pick a reader segment, write your email, schedule or send immediately. Powered by Resend with full bounce and click tracking.",
  },
  {
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    title: "Automations",
    desc: "Four trigger types: new_subscriber, segment_entered, ad_engaged, inactivity. Set a delay, write your template, activate. Dedup prevents duplicate sends.",
  },
  {
    icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    title: "Webhooks",
    desc: "Push subscriber events to Mailchimp, ConvertKit, or any Zapier webhook. Fires on lead_captured events, with active/paused control per endpoint.",
  },
]

const TRIGGERS = [
  { label: "new_subscriber", desc: "Fires when a reader subscribes via any gate type", color: "#27adb0" },
  { label: "segment_entered", desc: "Fires when a reader moves to a new segment (new → regular)", color: "#6366f1" },
  { label: "ad_engaged", desc: "Fires when a reader clicks or completes an ad gate", color: "#c4820a" },
  { label: "inactivity", desc: "Fires when no page signal received in N days (default: 14)", color: "#ec4899" },
]

const INTEGRATIONS = ["Mailchimp", "ConvertKit", "Zapier", "Any webhook URL"]

function AutomationBuilderMockup() {
  const AUTOMATIONS = [
    {
      name: "Welcome Sequence",
      trigger: "new_subscriber",
      triggerColor: "#27adb0",
      delay: "2 hours",
      subject: "You're in. Here's what to read first.",
      preview: "Welcome — your first picks are waiting inside...",
      openRate: "58.2%",
      clickRate: "12.4%",
      active: true,
    },
    {
      name: "Power User Reward",
      trigger: "segment_entered",
      triggerColor: "#6366f1",
      delay: "Immediate",
      subject: "You've unlocked subscriber perks.",
      preview: "You've read 25+ articles this month. Here's what that means for you...",
      openRate: "71.8%",
      clickRate: "22.1%",
      active: true,
    },
    {
      name: "Win-Back",
      trigger: "inactivity",
      triggerColor: "#ec4899",
      delay: "14 days",
      subject: "We miss you — catch up on what you missed.",
      preview: "It's been a while. Here are the 5 most-read stories since your last visit...",
      openRate: "34.6%",
      clickRate: "8.2%",
      active: false,
    },
  ]

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 760,
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: "var(--font-sans), -apple-system, sans-serif",
        boxShadow: "0 32px 80px rgba(0,0,0,0.1), 0 0 0 1px var(--color-border, #ebebeb)",
        background: "#fff",
      }}
    >
      {/* Header */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Automations</div>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>3 active rules · firing on reader events</div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-brand, #27adb0)", background: "rgba(39,173,176,0.08)", border: "1px solid rgba(39,173,176,0.2)", borderRadius: 7, padding: "5px 12px" }}>
          + New automation
        </div>
      </div>

      {/* Automation rows */}
      <div>
        {AUTOMATIONS.map((a, i) => (
          <div
            key={a.name}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 0,
              borderBottom: i < AUTOMATIONS.length - 1 ? "1px solid #f5f5f5" : "none",
              padding: "16px 20px",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              {/* Trigger pill */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: a.triggerColor, borderRadius: 6, padding: "4px 8px", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                  {a.trigger}
                </div>
                <div style={{ width: 1, height: 14, background: "#e8e8e8" }} />
                <div style={{ fontSize: 9, color: "#bbb", fontWeight: 500 }}>{a.delay}</div>
                <div style={{ width: 1, height: 14, background: "#e8e8e8" }} />
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={a.triggerColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>

              {/* Email preview */}
              <div style={{ flex: 1, background: "#fafafa", border: "1px solid #ebebeb", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#111", marginBottom: 3 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>Subject: <span style={{ fontStyle: "italic" }}>{a.subject}</span></div>
                <div style={{ fontSize: 10, color: "#aaa", marginBottom: 10 }}>{a.preview}</div>
                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                    <span style={{ fontSize: 10, color: "#888" }}>Open rate: <span style={{ fontWeight: 700, color: "#111" }}>{a.openRate}</span></span>
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#27adb0" }} />
                    <span style={{ fontSize: 10, color: "#888" }}>Clicks: <span style={{ fontWeight: 700, color: "#111" }}>{a.clickRate}</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 16 }}>
              <div style={{
                width: 32, height: 18, borderRadius: 9,
                background: a.active ? "var(--color-brand, #27adb0)" : "#e0e0e0",
                position: "relative", flexShrink: 0,
              }}>
                <div style={{
                  width: 12, height: 12, borderRadius: "50%", background: "#fff",
                  position: "absolute", top: 3,
                  left: a.active ? 17 : 3,
                  transition: "left 0.2s",
                }} />
              </div>
              <span style={{ fontSize: 10, color: a.active ? "#27adb0" : "#aaa", fontWeight: 600 }}>{a.active ? "Active" : "Paused"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EmailPage() {
  const heroRef = useScrollReveal<HTMLDivElement>()
  const featRef = useScrollReveal<HTMLDivElement>()
  const autoRef = useScrollReveal<HTMLDivElement>()
  const flowRef = useScrollReveal<HTMLDivElement>()
  const ctaRef = useScrollReveal<HTMLDivElement>()

  return (
    <>
      {/* Hero */}
      <section style={{ background: "#fff", paddingTop: 120, paddingBottom: 80, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 60% at 80% 0%, rgba(39,173,176,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="lp-container">
          <div ref={heroRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
              Email & CRM
            </div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, color: "var(--color-text)", margin: "0 0 20px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Reach the right readers,
              <br />
              <span className="lp-gradient-text">not all readers.</span>
            </h1>
            <p style={{ fontSize: 18, color: "var(--color-text-secondary)", maxWidth: 560, margin: "0 auto", lineHeight: 1.65 }}>
              Your subscriber list is pre-segmented by OnePaywall&apos;s reader intelligence. Send campaigns to power users only, automate a welcome sequence, or re-engage lapsed readers — all without an external ESP.
            </p>
          </div>
          <div className="lp-reveal-scale" style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ perspective: "1200px" }}>
              <div style={{ transform: "rotateX(4deg) rotateY(-3deg)", boxShadow: "0 40px 80px rgba(0,0,0,0.12), 0 0 0 1px var(--color-border)", borderRadius: 12 }}>
                <EmailCampaignMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 feature cards */}
      <section className="lp-section" style={{ background: "var(--color-surface)" }}>
        <div className="lp-container">
          <div ref={featRef} className="lp-stagger lp-grid-3">
            {FEATURES.map(f => (
              <div key={f.title} className="motion-lift" style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 12, padding: "28px 24px" }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: "rgba(39,173,176,0.08)", border: "1px solid rgba(39,173,176,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={f.icon} />
                  </svg>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", margin: "0 0 10px" }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Automation builder */}
      <section className="lp-section" style={{ background: "#fff" }}>
        <div className="lp-container">
          <div ref={autoRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Automation Engine</div>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, color: "var(--color-text)", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              Set it once. Runs forever.
            </h2>
            <p style={{ fontSize: 16, color: "var(--color-text-secondary)", maxWidth: 520, margin: "0 auto", lineHeight: 1.65 }}>
              Build welcome sequences, re-engagement flows, and segment milestone emails — all triggered by reader behaviour already tracked by OnePaywall.
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <AutomationBuilderMockup />
          </div>
        </div>
      </section>

      {/* Automation flow diagram */}
      <section className="lp-section" style={{ background: "var(--color-surface)" }}>
        <div className="lp-container">
          <div ref={flowRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Automation Triggers</div>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, color: "var(--color-text)", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              Behaviour-driven. Zero manual work.
            </h2>
            <p style={{ fontSize: 16, color: "var(--color-text-secondary)", maxWidth: 500, margin: "0 auto", lineHeight: 1.65 }}>
              Every automation runs on events OnePaywall already tracks. No extra tagging, no custom events.
            </p>
          </div>

          <div className="lp-stagger" style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
            {TRIGGERS.map((t) => (
              <div key={t.label} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 16 }}>
                <div style={{
                  background: "#fff", border: `1px solid ${t.color}30`,
                  borderRadius: 10, padding: "14px 18px",
                  display: "flex", alignItems: "center", gap: 12,
                  boxShadow: `0 0 0 3px ${t.color}10`,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text)", fontFamily: "var(--font-geist-mono), monospace" }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>{t.desc}</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                  <span style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>delay</span>
                </div>
                <div style={{ background: "rgba(39,173,176,0.06)", border: "1px solid rgba(39,173,176,0.2)", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-brand)" }}>Email sent</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section style={{ background: "#fff", padding: "48px 0", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
        <div className="lp-container" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>
            Works with your existing tools
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            {INTEGRATIONS.map(name => (
              <span key={name} style={{
                fontSize: 14, fontWeight: 600, color: "var(--color-text)",
                background: "var(--color-surface)", border: "1px solid var(--color-border)",
                borderRadius: 100, padding: "8px 20px",
              }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-section" style={{ background: "var(--color-brand)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
          <div ref={ctaRef} className="lp-reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.03em" }}>
              Start building your reader email list today.
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
