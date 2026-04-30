"use client"
import Link from "next/link"
import { useEffect, useState } from "react"

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        background: scrolled ? "rgba(8,10,11,0.85)" : "rgba(8,10,11,0)",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
        transition: "background 0.3s ease, border-color 0.3s ease",
      }}
    >
      <div className="lp-nav-inner">
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <div style={{ width: 30, height: 30, background: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>OnePaywall</span>
        </Link>

        {/* CTAs */}
        <div className="lp-nav-links">
          <Link
            href="/login"
            className="lp-btn-ghost lp-nav-signin"
            style={{ padding: "8px 18px", fontSize: 13, textDecoration: "none", display: "inline-block" }}
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="lp-btn-primary"
            style={{ padding: "8px 18px", fontSize: 13, textDecoration: "none", display: "inline-block", fontWeight: 600 }}
          >
            Start free trial
          </Link>
        </div>
      </div>
    </nav>
  )
}
