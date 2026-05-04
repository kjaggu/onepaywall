"use client"
import Link from "next/link"

const FEATURE_LINKS = [
  { label: "Adaptive Gates", href: "/features/gates" },
  { label: "Reader Intelligence", href: "/features/intelligence" },
  { label: "Analytics Suite", href: "/features/analytics" },
  { label: "Ad Management", href: "/features/ads" },
  { label: "Email & CRM", href: "/features/email" },
]

const RESOURCE_LINKS = [
  { label: "Case Studies", href: "/case-studies" },
  { label: "Announcements", href: "/announcements" },
  { label: "Documentation", href: "/docs" },
  { label: "Changelog", href: "/changelog" },
  { label: "Status", href: "/status" },
]

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "mailto:hello@onepaywall.com" },
  { label: "Careers", href: "/careers" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
]

const linkStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--color-text-secondary)",
  textDecoration: "none",
  fontWeight: 400,
  transition: "color 0.15s ease",
}

export function LandingFooter() {
  return (
    <footer style={{ background: "#fff", borderTop: "1px solid var(--color-border)", padding: "56px 0" }}>
      <div className="lp-footer-inner" style={{ flexWrap: "wrap", gap: 40, alignItems: "flex-start" }}>
        {/* Col 1: Logo + tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 160 }}>
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

        {/* Col 2: Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: 2 }}>
            Features
          </div>
          {FEATURE_LINKS.map(link => (
            <Link
              key={link.label}
              href={link.href}
              style={linkStyle}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-secondary)")}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Col 3: Resources */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: 2 }}>
            Resources
          </div>
          {RESOURCE_LINKS.map(link => (
            <Link
              key={link.label}
              href={link.href}
              style={linkStyle}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text-secondary)")}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Col 4: Company */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: 2 }}>
            Company
          </div>
          {COMPANY_LINKS.map(link => (
            <Link
              key={link.label}
              href={link.href}
              style={linkStyle}
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
