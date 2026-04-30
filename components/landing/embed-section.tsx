"use client"
import { useState } from "react"
import { useScrollReveal } from "./hooks/use-scroll-reveal"

const CODE = `<script
  src="https://cdn.onepaywall.com/v1/embed.js"
  data-site-key="pk_live_••••••••"
  async>
</script>`

const CMS_BADGES = ["WordPress", "Ghost", "Webflow", "Next.js", "Hugo", "Nuxt", "Any HTML"]

const STEPS = [
  { num: "01", label: "Create a gate", body: "Pick a template or build custom rules in the dashboard. Set priority, targeting, and steps." },
  { num: "02", label: "Add one script tag", body: "Drop the embed snippet into your site's <head>. No build step, no SDK, no dependency." },
  { num: "03", label: "Go live in minutes", body: "OnePaywall starts serving gate decisions immediately. Revenue data appears in real time." },
]

export function EmbedSection() {
  const [copied, setCopied] = useState(false)
  const headRef = useScrollReveal<HTMLDivElement>()
  const stepsRef = useScrollReveal<HTMLDivElement>()
  const codeRef = useScrollReveal<HTMLDivElement>()

  function copy() {
    navigator.clipboard.writeText(CODE.replace(/•+/g, "YOUR_SITE_KEY"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section style={{ background: "#080a0b", padding: "120px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        {/* Heading */}
        <div ref={headRef} className="lp-reveal" style={{ textAlign: "center", marginBottom: 72 }}>
          <div style={{ fontSize: 11, color: "#27adb0", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
            Dead simple setup
          </div>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, color: "#fff", margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Live in under 5 minutes.
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.45)", maxWidth: 500, margin: "0 auto", lineHeight: 1.65 }}>
            One script tag. No SDK, no rebuild, no CMS plugin. OnePaywall runs on any website.
          </p>
          {/* CMS badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 24 }}>
            {CMS_BADGES.map(cms => (
              <span key={cms} style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, padding: "4px 12px", fontWeight: 500 }}>
                {cms}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>
          {/* Steps */}
          <div ref={stepsRef} className="lp-stagger" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {STEPS.map(s => (
              <div key={s.num} style={{ display: "flex", gap: 20 }}>
                <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(39,173,176,0.3)", background: "rgba(39,173,176,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#27adb0" }}>{s.num}</span>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{s.body}</div>
                </div>
              </div>
            ))}

            {/* Size callout */}
            <div style={{ display: "flex", gap: 24, paddingTop: 8 }}>
              {["11.7 KB raw", "3.4 KB gzip", "No dependencies"].map(tag => (
                <div key={tag} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#27adb0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>{tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Code block */}
          <div ref={codeRef} className="lp-reveal-scale">
            <div style={{ background: "#0d1117", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
              {/* Code bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {["#ff5f57","#febc2e","#28c840"].map(c => (
                    <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-geist-mono), monospace" }}>embed snippet</div>
                <button
                  onClick={copy}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: copied ? "#27adb0" : "rgba(255,255,255,0.3)", padding: "4px 8px", borderRadius: 5, transition: "color 0.2s" }}
                >
                  {copied ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Code */}
              <pre style={{ margin: 0, padding: "22px 24px", fontSize: 13, lineHeight: 1.8, overflow: "auto", fontFamily: "var(--font-geist-mono), 'Fira Code', monospace" }}>
                <span style={{ color: "#e34c26" }}>&lt;script</span>{"\n"}
                {"  "}<span style={{ color: "#79b8ff" }}>src</span><span style={{ color: "#fff" }}>=</span><span style={{ color: "#9ecbff" }}>"https://cdn.onepaywall.com/v1/embed.js"</span>{"\n"}
                {"  "}<span style={{ color: "#79b8ff" }}>data-site-key</span><span style={{ color: "#fff" }}>=</span><span style={{ color: "#9ecbff" }}>"pk_live_</span><span style={{ color: "rgba(255,255,255,0.25)" }}>••••••••</span><span style={{ color: "#9ecbff" }}>"</span>{"\n"}
                {"  "}<span style={{ color: "#79b8ff" }}>async</span><span style={{ color: "#e34c26" }}>&gt;</span>{"\n"}
                <span style={{ color: "#e34c26" }}>&lt;/script&gt;</span>
              </pre>

              {/* Footer note */}
              <div style={{ padding: "10px 24px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-geist-mono), monospace" }}>
                  // 11.7 KB · no follow-up API calls · works with any CSP
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
