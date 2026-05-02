"use client"
import Link from "next/link"

const LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Docs", href: "/docs" },
  { label: "Status", href: "/status" },
  { label: "Contact", href: "mailto:hello@onepaywall.com" },
]

const FEATURE_LINKS = [
  { label: "Adaptive Gates", href: "/features/gates" },
  { label: "Reader Intelligence", href: "/features/intelligence" },
  { label: "Analytics Suite", href: "/features/analytics" },
  { label: "Ad Management", href: "/features/ads" },
  { label: "Email & CRM", href: "/features/email" },
]

export function LandingFooter() {
  return (
    <footer style={{ background: "#fff", borderTop: "1px solid var(--color-border)", padding: "48px 0" }}>
      <div className="lp-footer-inner" style={{ flexWrap: "wrap", gap: 32, alignItems: "flex-start" }}>
        {/* Logo + tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, background: "var(--color-brand)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>OnePaywall</span>
          </div>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Intelligent monetisation for publishers.</span>
        </div>

        {/* Features column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: 2 }}>
            Features
          </div>
          {FEATURE_LINKS.map(link => (
            <Link
              key={link.label}
              href={link.href}
              style={{ fontSize: 13, color: "var(--color-text-secondary)", textDecoration: "none", fontWeight: 400, transition: "color 0.15s ease" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-secondary)")}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Links */}
        <div className="lp-footer-links" style={{ display: "flex", alignItems: "center", gap: 24, marginLeft: "auto" }}>
          {LINKS.map(link => (
            <Link
              key={link.label}
              href={link.href}
              style={{ fontSize: 12, color: "var(--color-text-secondary)", textDecoration: "none", fontWeight: 500, transition: "color 0.15s ease" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-secondary)")}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
