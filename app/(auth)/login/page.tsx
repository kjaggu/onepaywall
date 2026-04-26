"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)

  function inputStyle(name: string): React.CSSProperties {
    return {
      width: "100%",
      padding: "8px 12px",
      fontSize: 13,
      border: "1px solid",
      borderColor: error ? "#fca5a5" : focused === name ? "#555" : "#e5e5e5",
      borderRadius: 6,
      outline: "none",
      background: "#fff",
      transition: "border-color 0.12s",
      color: "#111",
      fontFamily: "inherit",
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.")
        return
      }

      router.push(data.redirectTo)
    } catch {
      setError("Could not reach the server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#fff" }}>

      {/* ── Left: form ── */}
      <div style={{ flex: "0 0 380px", display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px", borderRight: "1px solid #ebebeb" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40 }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={12} height={12} viewBox="0 0 16 16" fill="none">
              <rect x={2} y={4} width={12} height={8} rx={1.5} stroke="white" strokeWidth={1.5} />
              <path d="M5 4V3a3 3 0 016 0v1" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
              <circle cx={8} cy={8} r={1} fill="white" />
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>OnePaywall</span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#111", marginBottom: 4 }}>Sign in</h1>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 28 }}>to your publisher account</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 5 }}>
              Email address
            </label>
            <input
              type="email"
              placeholder="you@publication.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              style={inputStyle("email")}
              required
            />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#555" }}>Password</label>
              <Link href="/forgot-password" style={{ fontSize: 12, color: "#27adb0", textDecoration: "none" }}>
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              style={inputStyle("password")}
              required
            />
          </div>

          {error && (
            <div style={{ padding: "9px 12px", borderRadius: 6, background: "#fef2f2", border: "1px solid #fca5a5", fontSize: 12, color: "#c0392b" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 4, padding: "8px", borderRadius: 6, fontSize: 13, fontWeight: 600, background: loading ? "#555" : "#111", color: "#fff", border: "none", cursor: loading ? "default" : "pointer", transition: "background 0.1s", fontFamily: "inherit" }}
          >
            {loading ? "Signing in…" : "Continue"}
          </button>
        </form>

        {/* Sign up */}
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #ebebeb", display: "flex", justifyContent: "center", gap: 4, fontSize: 12, color: "#aaa" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "#111", fontWeight: 500, textDecoration: "none" }}>
            Sign up free
          </Link>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "auto", paddingTop: 24, display: "flex", gap: 16, fontSize: 12, color: "#aaa" }}>
          <a href="#" style={{ color: "#aaa" }}>Privacy</a>
          <a href="#" style={{ color: "#aaa" }}>Terms</a>
          <a href="#" style={{ color: "#aaa" }}>Status</a>
        </div>
      </div>

      {/* ── Right: marketing ── */}
      <div style={{ flex: 1, background: "#fafafa", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 64px" }}>
        <div style={{ maxWidth: 440 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#27adb0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
            Publisher intelligence
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 600, color: "#111", lineHeight: 1.25, marginBottom: 16 }}>
            Every reader.<br />The right gate.
          </h2>
          <p style={{ fontSize: 14, color: "#666", lineHeight: 1.65, marginBottom: 36 }}>
            OnePaywall sits between your content and your readers — deciding in milliseconds whether to show a paywall, serve an ad, or let them through. Built for publishers who take revenue seriously.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", background: "#ebebeb", marginBottom: 36 }}>
            {[{ v: "$2.4B", l: "Revenue gated" }, { v: "38 ms", l: "Decision time" }, { v: "4.1×", l: "Conversion lift" }].map((s) => (
              <div key={s.l} style={{ padding: "16px 18px", background: "#fff" }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>{s.v}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>{s.l}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: "#bbb", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>Trusted by</div>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            {["The Courier", "DiveWire", "PressHub", "Latitude", "InkPost"].map((n) => (
              <span key={n} style={{ fontSize: 13, fontWeight: 600, color: "#ccc" }}>{n}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
