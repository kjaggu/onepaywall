"use client"
import { useScrollReveal } from "./hooks/use-scroll-reveal"
import { IntelligenceMockup } from "./mockups/intelligence-mockup"

const BEFORE = [
  "Same paywall for every reader, every visit",
  "No fallback when readers refuse to pay",
  "Zero signal on who actually converts",
  "Revenue left on the table every hour",
  "No visibility into what your content earns",
]

const AFTER = [
  "Gate type chosen per reader in real time",
  "Ad gate or free pass when paywall won't land",
  "Full read-time, scroll-depth, and return-rate data",
  "Every reader interaction turns into signal",
  "Per-domain, per-gate revenue attribution",
]

const FLOW_NODES = [
  { label: "Reader arrives", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "rgba(255,255,255,0.06)" },
  { label: "Fingerprint\n38 ms", icon: "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18", color: "rgba(39,173,176,0.12)", accent: true },
  { label: "Intelligence\nprofile", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", color: "rgba(255,255,255,0.06)" },
  { label: "Gate\ndecision", icon: "M8 9l4-4 4 4m0 6l-4 4-4-4", color: "rgba(39,173,176,0.12)", accent: true },
  { label: "Revenue\ncaptured", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "rgba(34,197,94,0.12)" },
]

export function IntelligenceSection() {
  const headRef = useScrollReveal<HTMLDivElement>()
  const cardsRef = useScrollReveal<HTMLDivElement>()
  const flowRef = useScrollReveal<HTMLDivElement>()
  const mockupRef = useScrollReveal<HTMLDivElement>()

  return (
    <section id="features" className="lp-section" style={{ background: "#080a0b" }}>
      <div className="lp-container">
        {/* Heading */}
        <div ref={headRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: 11, color: "#27adb0", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
            The monetisation gap
          </div>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            A payment button is not a strategy.
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.45)", marginTop: 16, maxWidth: 560, marginLeft: "auto", marginRight: "auto", lineHeight: 1.65 }}>
            Most publishers put up a paywall and hope. OnePaywall reads every visitor and routes them to the gate most likely to convert.
          </p>
        </div>

        {/* Before / After cards */}
        <div ref={cardsRef} className="lp-stagger lp-intelligence-grid" style={{ marginBottom: 80 }}>
          {/* Before */}
          <div style={{ background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.18)", borderRadius: 16, padding: "28px 28px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c0392b", marginBottom: 20 }}>Before OnePaywall</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {BEFORE.map(text => (
                <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow divider */}
          <div className="lp-intelligence-arrow" style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#27adb0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>

          {/* After */}
          <div style={{ background: "rgba(39,173,176,0.06)", border: "1px solid rgba(39,173,176,0.2)", borderRadius: 16, padding: "28px 28px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#27adb0", marginBottom: 20 }}>With OnePaywall</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {AFTER.map(text => (
                <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#27adb0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decision flow */}
        <div ref={flowRef} className="lp-reveal" style={{ marginBottom: 80 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", marginBottom: 28 }}>
            How every gate decision happens
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
            {FLOW_NODES.map((node, i) => (
              <div key={node.label} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 54, height: 54, borderRadius: 14, background: node.color, border: `1px solid ${node.accent ? "rgba(39,173,176,0.3)" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={node.accent ? "#27adb0" : "rgba(255,255,255,0.5)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={node.icon} />
                    </svg>
                  </div>
                  <div style={{ fontSize: 11, color: node.accent ? "#27adb0" : "rgba(255,255,255,0.45)", fontWeight: node.accent ? 600 : 400, textAlign: "center", lineHeight: 1.4, whiteSpace: "pre-line" }}>
                    {node.label}
                  </div>
                </div>
                {i < FLOW_NODES.length - 1 && (
                  <div style={{ width: 48, height: 1, background: "rgba(255,255,255,0.1)", flexShrink: 0, position: "relative", bottom: 12 }}>
                    <div style={{ position: "absolute", right: 0, top: -4, width: 8, height: 8, borderTop: "1px solid rgba(255,255,255,0.2)", borderRight: "1px solid rgba(255,255,255,0.2)", transform: "rotate(45deg)" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Intelligence mockup */}
        <div ref={mockupRef} className="lp-reveal-scale" style={{ display: "flex", justifyContent: "center" }}>
          <IntelligenceMockup />
        </div>
      </div>
    </section>
  )
}
