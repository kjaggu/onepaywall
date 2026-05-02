"use client"
import Link from "next/link"
import { useScrollReveal } from "@/components/landing/hooks/use-scroll-reveal"
import { GateBuilderMockup } from "@/components/landing/mockups/gate-builder-mockup"
import { IntelligenceMockup } from "@/components/landing/mockups/intelligence-mockup"

const GATE_TYPES = [
  {
    icon: "M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.899L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z",
    name: "Ad gate",
    desc: "Show a video or display ad. Earn on completion rate or let readers skip.",
    color: "#c4820a",
  },
  {
    icon: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z",
    name: "Subscription CTA",
    desc: "Prompt a recurring plan with custom heading and copy.",
    color: "#27adb0",
  },
  {
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    name: "Pay to unlock",
    desc: "Charge per article. Reader keeps permanent access after payment.",
    color: "#22c55e",
  },
  {
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    name: "Lead capture",
    desc: "Gate behind an email opt-in with GDPR consent checkbox.",
    color: "#6366f1",
  },
  {
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    name: "Digital product",
    desc: "Sell a downloadable file. Auto-fulfilled directly from R2 CDN.",
    color: "#ec4899",
  },
  {
    icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
    name: "Newsletter opt-in",
    desc: "Grow your list. Reader exchanges email for free content access.",
    color: "#f59e0b",
  },
]

const TRIGGERS = [
  { label: "Visit count threshold", desc: "Trigger after the Nth visit. Give first-time readers a free pass, monetise regulars." },
  { label: "Device type", desc: "Different gates for mobile vs. desktop. Optimise for each surface." },
  { label: "Reader segment", desc: "Target new, casual, regular, or power_user segments independently." },
  { label: "Monetisation probability", desc: "Show paywalls only to readers with a high likelihood to pay (0–1 score)." },
  { label: "URL pattern", desc: "Apply gates to specific sections or article types using glob patterns." },
  { label: "Time since publication", desc: "Give readers a free window after publish, then gate late traffic." },
]

function Section({ id, children }: { id?: string; children: React.ReactNode }) {
  return <section id={id} className="lp-section" style={{ background: "#fff" }}>{children}</section>
}

function AltSection({ children }: { children: React.ReactNode }) {
  return <section className="lp-section" style={{ background: "var(--color-surface)" }}>{children}</section>
}

export default function GatesPage() {
  const headRef = useScrollReveal<HTMLDivElement>()
  const typesRef = useScrollReveal<HTMLDivElement>()
  const triggersRef = useScrollReveal<HTMLDivElement>()
  const triggersHeadRef = useScrollReveal<HTMLDivElement>()
  const flowRef = useScrollReveal<HTMLDivElement>()
  const ctaRef = useScrollReveal<HTMLDivElement>()

  return (
    <>
      {/* Hero */}
      <section style={{ background: "#fff", paddingTop: 120, paddingBottom: 80, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 60% at 80% 0%, rgba(39,173,176,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="lp-container">
          <div ref={headRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
              Adaptive Gates
            </div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, color: "var(--color-text)", margin: "0 0 20px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Six ways to monetise.
              <br />
              <span className="lp-gradient-text">One decision engine.</span>
            </h1>
            <p style={{ fontSize: 18, color: "var(--color-text-secondary)", maxWidth: 540, margin: "0 auto", lineHeight: 1.65 }}>
              From ad gates to digital product paywalls, every gate type works on the same trigger system. Readers see the right ask — never a blunt wall.
            </p>
          </div>

          <div className="lp-reveal-scale" style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ perspective: "1200px", perspectiveOrigin: "50% 40%" }}>
              <div style={{ transform: "rotateX(4deg) rotateY(-3deg) rotateZ(0.5deg)", boxShadow: "0 40px 80px rgba(0,0,0,0.12), 0 0 0 1px var(--color-border)", borderRadius: 12 }}>
                <GateBuilderMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gate types */}
      <AltSection>
        <div className="lp-container">
          <div ref={typesRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, color: "var(--color-text)", margin: 0, letterSpacing: "-0.02em" }}>
              Six gate types, one unified dashboard.
            </h2>
          </div>
          <div className="lp-stagger lp-grid-3">
            {GATE_TYPES.map(g => (
              <div key={g.name} className="motion-lift" style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 12, padding: "24px 20px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${g.color}18`, border: `1px solid ${g.color}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={g.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={g.icon} />
                  </svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>{g.name}</div>
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{g.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </AltSection>

      {/* Smart triggers */}
      <Section>
        <div className="lp-container">
          <div className="lp-gateway-grid">
            <div ref={triggersHeadRef} className="lp-reveal" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Smart Triggers</div>
                <h2 style={{ fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, color: "var(--color-text)", margin: "0 0 16px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                  Show the right gate to the right reader.
                </h2>
                <p style={{ fontSize: 16, color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0 }}>
                  Triggers stack as AND conditions. Priority order resolves conflicts when a reader matches multiple gates.
                </p>
              </div>
              <div ref={triggersRef} className="lp-stagger" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {TRIGGERS.map(t => (
                  <div key={t.label} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-brand)", marginTop: 6, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", marginBottom: 2 }}>{t.label}</div>
                      <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{t.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div ref={flowRef} className="lp-reveal-scale" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <IntelligenceMockup />
            </div>
          </div>
        </div>
      </Section>

      {/* Payment routing */}
      <AltSection>
        <div className="lp-container">
          <div className="lp-gateway-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
              {[
                { icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "#22c55e", label: "Reader subscribes", sub: "Checkout on your site" },
                null,
                { icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", color: "#27adb0", label: "Your Razorpay account", sub: "Directly — no platform take, no delay", badge: "Direct" },
              ].map((node, i) => node === null ? (
                <div key={i} style={{ display: "flex", alignItems: "center", padding: "0 28px", height: 40 }}>
                  <div style={{ width: 1, height: "100%", background: "linear-gradient(to bottom, rgba(34,197,94,0.3), rgba(39,173,176,0.3))", marginLeft: 19 }} />
                  <div style={{ position: "absolute", left: 48, fontSize: 10, color: "var(--color-text-secondary)", fontFamily: "var(--font-geist-mono), monospace" }}>payment lands in</div>
                </div>
              ) : (
                <div key={node.label} style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${node.color}18`, border: `1px solid ${node.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={node.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={node.icon} />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)" }}>{node.label}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{node.sub}</div>
                  </div>
                  {node.badge && <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 600, background: "rgba(34,197,94,0.1)", padding: "4px 10px", borderRadius: 20 }}>{node.badge}</div>}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ fontSize: 11, color: "var(--color-brand)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Bring your own keys</div>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 800, color: "var(--color-text)", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                Your gateway. Your money. Direct.
              </h2>
              <p style={{ fontSize: 16, color: "var(--color-text-secondary)", lineHeight: 1.7, margin: 0 }}>
                Connect your own Razorpay account. Every rupee from reader payments lands in your bank. OnePaywall never pools or holds your revenue.
              </p>
              {[
                "Connect your own Razorpay account or use platform shared keys",
                "Credentials stored with AES-256-GCM encryption, never in plain text",
                "Supports one-time article unlocks and recurring monthly subscriptions",
              ].map(pt => (
                <div key={pt} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(39,173,176,0.1)", border: "1px solid rgba(39,173,176,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>{pt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AltSection>

      {/* CTA band */}
      <section className="lp-section" style={{ background: "var(--color-brand)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 32px", textAlign: "center" }}>
          <div ref={ctaRef} className="lp-reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.03em" }}>
              Build your first gate in 5 minutes.
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
