"use client"
import Link from "next/link"
import { useMouseParallax } from "./hooks/use-mouse-parallax"
import { AnalyticsMockup } from "./mockups/analytics-mockup"

interface Badge { label: string; sub: string; top: string; left?: string; right?: string; delay: string }

const BADGES: Badge[] = [
  { label: "38 ms", sub: "decision time",     top: "12%", left: "-5%",  delay: "0s" },
  { label: "4.1×",  sub: "conversion lift",   top: "55%", left: "-8%",  delay: "0.3s" },
  { label: "0 PII", sub: "for anon. readers", top: "82%", left: "5%",   delay: "0.6s" },
  { label: "5 min", sub: "to first gate",     top: "8%",  right: "0%",  delay: "0.2s" },
]

export function Hero() {
  const { containerRef, tilt } = useMouseParallax(6)

  return (
    <section
      ref={containerRef as React.RefObject<HTMLElement>}
      style={{
        minHeight: "100vh",
        background: "#080a0b",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        paddingTop: 80,
      }}
    >
      {/* Dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, #000 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, #000 40%, transparent 100%)",
        }}
      />

      {/* Glow orbs */}
      <div style={{ position: "absolute", top: "15%", left: "30%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(39,173,176,0.18) 0%, transparent 70%)", animation: "lp-orb-drift 18s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "25%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(39,173,176,0.12) 0%, transparent 70%)", animation: "lp-orb-drift 24s ease-in-out infinite reverse", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", position: "relative", width: "100%" }}>
        {/* Left: text */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* Trial badge */}
          <div style={{ animation: "lp-slide-up 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid rgba(39,173,176,0.4)", borderRadius: 100, padding: "6px 14px", fontSize: 12, color: "#27adb0", fontWeight: 600, background: "rgba(39,173,176,0.08)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#27adb0", display: "inline-block", animation: "lp-glow-pulse 2s ease-in-out infinite" }} />
              14-day free trial · No credit card required
            </span>
          </div>

          {/* Headline */}
          <div style={{ animation: "lp-slide-up 0.65s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}>
            <h1 style={{ fontSize: "clamp(40px, 5vw, 62px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#fff", margin: 0 }}>
              Turn every reader
              <br />
              into{" "}
              <span className="lp-gradient-text">revenue.</span>
            </h1>
          </div>

          {/* Sub */}
          <div style={{ animation: "lp-slide-up 0.65s cubic-bezier(0.16,1,0.3,1) 0.3s both" }}>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, margin: 0, maxWidth: 480 }}>
              OnePaywall sits between your content and your readers, deciding in 38 ms whether to show a paywall, serve an ad, or let them through. Built for publishers who take monetisation seriously.
            </p>
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, animation: "lp-slide-up 0.65s cubic-bezier(0.16,1,0.3,1) 0.4s both" }}>
            <Link href="/register" className="lp-btn-primary" style={{ padding: "14px 28px", fontSize: 15, textDecoration: "none", display: "inline-block", fontWeight: 700 }}>
              Start free trial
            </Link>
            <a
              href="#features"
              className="lp-btn-ghost"
              style={{ padding: "14px 24px", fontSize: 15, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              See how it works
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 9l-7 7-7-7"/>
              </svg>
            </a>
          </div>

          {/* Trust line */}
          <div style={{ animation: "lp-slide-up 0.65s cubic-bezier(0.16,1,0.3,1) 0.5s both", display: "flex", alignItems: "center", gap: 14 }}>
            {["The Courier", "DiveWire", "PressHub", "Latitude"].map((pub, i) => (
              <span key={pub} style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>
                {i > 0 && <span style={{ marginRight: 14, opacity: 0.3 }}>·</span>}
                {pub}
              </span>
            ))}
          </div>
        </div>

        {/* Right: 3D mockup */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            animation: "lp-slide-up 0.8s cubic-bezier(0.16,1,0.3,1) 0.35s both",
          }}
        >
          {/* Floating badges */}
          {BADGES.map(b => (
            <div
              key={b.label}
              style={{
                position: "absolute",
                top: b.top,
                left: b.left,
                right: b.right,
                animation: `lp-float 4s ease-in-out ${b.delay} infinite`,
                zIndex: 10,
              }}
            >
              <div style={{
                background: "rgba(15,18,20,0.9)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                padding: "8px 14px",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                whiteSpace: "nowrap",
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#27adb0", letterSpacing: "-0.03em" }}>{b.label}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{b.sub}</div>
              </div>
            </div>
          ))}

          {/* Perspective wrapper */}
          <div style={{ perspective: "1200px", perspectiveOrigin: "50% 40%" }}>
            <div
              style={{
                transform: `rotateX(${8 - tilt.x * 0.5}deg) rotateY(${-10 + tilt.y * 0.8}deg) rotateZ(1.5deg) scale(0.88)`,
                transition: "transform 0.1s linear",
                boxShadow: "0 60px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06), 0 0 60px rgba(39,173,176,0.12)",
                borderRadius: 12,
              }}
            >
              <AnalyticsMockup />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, animation: "lp-float 3s ease-in-out infinite" }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>Scroll</div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
    </section>
  )
}
