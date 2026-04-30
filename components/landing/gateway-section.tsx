"use client"
import { useScrollReveal } from "./hooks/use-scroll-reveal"

const POINTS = [
  { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", text: "Connect your own Razorpay account or use the platform's shared keys" },
  { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", text: "Credentials stored with AES-256-GCM encryption, never in plain text" },
  { icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", text: "Supports one-time article unlocks and recurring monthly subscriptions" },
]

export function GatewaySection() {
  const headRef = useScrollReveal<HTMLDivElement>()
  const diagramRef = useScrollReveal<HTMLDivElement>()
  const pointsRef = useScrollReveal<HTMLDivElement>()

  return (
    <section className="lp-section" style={{ background: "#06080a" }}>
      <div className="lp-container">
        <div className="lp-gateway-grid">
          {/* Left: diagram */}
          <div ref={diagramRef} className="lp-reveal-scale">
            <div style={{ position: "relative" }}>
              {/* Flow nodes */}
              <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
                {/* Reader pays */}
                <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", gap: 14, marginBottom: 2 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Reader subscribes</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Checkout on your site</div>
                  </div>
                </div>

                {/* Connector */}
                <div style={{ display: "flex", alignItems: "center", padding: "0 28px", height: 40 }}>
                  <div style={{ width: 1, height: "100%", background: "linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(39,173,176,0.4))", marginLeft: 19 }} />
                  <div style={{ position: "absolute", left: 48, fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-geist-mono), monospace" }}>OnePaywall routes</div>
                </div>

                {/* OnePaywall layer */}
                <div style={{ background: "rgba(39,173,176,0.06)", border: "1px solid rgba(39,173,176,0.2)", borderRadius: 14, padding: "16px 22px", display: "flex", alignItems: "center", gap: 14, margin: "0 16px 2px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(39,173,176,0.12)", border: "1px solid rgba(39,173,176,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#27adb0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#27adb0" }}>OnePaywall infrastructure</div>
                    <div style={{ fontSize: 12, color: "rgba(39,173,176,0.5)" }}>Routes, records, and webhooks — nothing more</div>
                  </div>
                </div>

                {/* Connector */}
                <div style={{ display: "flex", alignItems: "center", padding: "0 28px", height: 40 }}>
                  <div style={{ width: 1, height: "100%", background: "linear-gradient(to bottom, rgba(39,173,176,0.4), rgba(255,255,255,0.1))", marginLeft: 19 }} />
                  <div style={{ position: "absolute", left: 48, fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-geist-mono), monospace" }}>payment lands in</div>
                </div>

                {/* Your Razorpay account */}
                <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(39,173,176,0.08)", border: "1px solid rgba(39,173,176,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#27adb0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Your Razorpay account</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Directly — no platform take, no delay</div>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: 11, color: "#22c55e", fontWeight: 600, background: "rgba(34,197,94,0.1)", padding: "4px 10px", borderRadius: 20 }}>Direct</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: copy */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div ref={headRef} className="lp-reveal">
              <div style={{ fontSize: 11, color: "#27adb0", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
                Bring your own keys
              </div>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 800, color: "#fff", margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                Your gateway. Your money. Direct.
              </h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: 0 }}>
                Connect your own Razorpay account. Every rupee from reader payments lands in your bank. OnePaywall never pools or holds your revenue.
              </p>
            </div>

            <div ref={pointsRef} className="lp-stagger" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {POINTS.map(pt => (
                <div key={pt.text} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(39,173,176,0.08)", border: "1px solid rgba(39,173,176,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27adb0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={pt.icon} />
                    </svg>
                  </div>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: 0 }}>{pt.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
