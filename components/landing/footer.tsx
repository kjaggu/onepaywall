"use client"
import Link from "next/link"

const LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Docs", href: "/docs" },
  { label: "Status", href: "/status" },
  { label: "Contact", href: "mailto:hello@onepaywall.com" },
]

export function LandingFooter() {
  return (
    <footer style={{ background: "#06080a", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "40px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo + tagline */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 26, height: 26, background: "rgba(255,255,255,0.08)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>OnePaywall</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Intelligent monetisation for publishers.</span>
        </div>

        {/* Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {LINKS.map(link => (
            <Link
              key={link.label}
              href={link.href}
              style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none", fontWeight: 500, transition: "color 0.15s ease" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
