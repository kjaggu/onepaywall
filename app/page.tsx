import Link from "next/link"

export default function LandingPage() {
  return (
    <div style={{ display: "flex", height: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff", gap: 24 }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={15} height={15} viewBox="0 0 16 16" fill="none">
            <rect x={2} y={4} width={12} height={8} rx={1.5} stroke="white" strokeWidth={1.5} />
            <path d="M5 4V3a3 3 0 016 0v1" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
            <circle cx={8} cy={8} r={1} fill="white" />
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 20, color: "#111", letterSpacing: "-0.01em" }}>OnePaywall</span>
      </div>

      {/* Tagline */}
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <p style={{ fontSize: 15, color: "#555", lineHeight: 1.6 }}>
          Intelligent monetization for publishers.<br />
          Every reader gets the right gate — paywall, ad, or free pass.
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/login"
        style={{ padding: "8px 20px", borderRadius: 6, background: "#111", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
      >
        Sign in
      </Link>
    </div>
  )
}
