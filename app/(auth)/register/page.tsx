"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", publicationName: "", email: "", password: "", confirmPassword: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

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
      boxSizing: "border-box",
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          publicationName: form.publicationName,
          email: form.email,
          password: form.password,
        }),
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
      <div style={{ flex: "0 0 420px", display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px", borderRight: "1px solid #ebebeb", overflowY: "auto" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36 }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={12} height={12} viewBox="0 0 16 16" fill="none">
              <rect x={2} y={4} width={12} height={8} rx={1.5} stroke="white" strokeWidth={1.5} />
              <path d="M5 4V3a3 3 0 016 0v1" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
              <circle cx={8} cy={8} r={1} fill="white" />
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>OnePaywall</span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#111", marginBottom: 4 }}>Create your account</h1>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 28 }}>Start your 14-day free trial — no credit card required</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 5 }}>
                Full name
              </label>
              <input
                type="text"
                placeholder="Jane Smith"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                onFocus={() => setFocused("name")}
                onBlur={() => setFocused(null)}
                style={inputStyle("name")}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 5 }}>
                Publication name
              </label>
              <input
                type="text"
                placeholder="The Daily Ink"
                value={form.publicationName}
                onChange={(e) => set("publicationName", e.target.value)}
                onFocus={() => setFocused("publicationName")}
                onBlur={() => setFocused(null)}
                style={inputStyle("publicationName")}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 5 }}>
              Work email
            </label>
            <input
              type="email"
              placeholder="you@publication.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              style={inputStyle("email")}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 5 }}>
              Password
            </label>
            <input
              type="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              style={inputStyle("password")}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 5 }}>
              Confirm password
            </label>
            <input
              type="password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
              onFocus={() => setFocused("confirmPassword")}
              onBlur={() => setFocused(null)}
              style={inputStyle("confirmPassword")}
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
            style={{ marginTop: 4, padding: "9px", borderRadius: 6, fontSize: 13, fontWeight: 600, background: loading ? "#555" : "#111", color: "#fff", border: "none", cursor: loading ? "default" : "pointer", transition: "background 0.1s", fontFamily: "inherit" }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", margin: 0 }}>
            By signing up you agree to our{" "}
            <a href="#" style={{ color: "#555", textDecoration: "none" }}>Terms</a>{" "}
            and{" "}
            <a href="#" style={{ color: "#555", textDecoration: "none" }}>Privacy Policy</a>.
          </p>
        </form>

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #ebebeb", display: "flex", justifyContent: "center", gap: 4, fontSize: 12, color: "#aaa" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#111", fontWeight: 500, textDecoration: "none" }}>
            Sign in
          </Link>
        </div>
      </div>

      {/* ── Right: marketing ── */}
      <div style={{ flex: 1, background: "#fafafa", display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 64px" }}>
        <div style={{ maxWidth: 440 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#27adb0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
            14-day free trial
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 600, color: "#111", lineHeight: 1.25, marginBottom: 16 }}>
            Turn every reader<br />into revenue.
          </h2>
          <p style={{ fontSize: 14, color: "#666", lineHeight: 1.65, marginBottom: 36 }}>
            OnePaywall decides in milliseconds whether to show a paywall, serve an ad, or let a reader through — maximising revenue without driving dropoff. Setup takes under 5 minutes.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 36 }}>
            {[
              { icon: "⚡", title: "Instant embed", desc: "One script tag. Works with any CMS." },
              { icon: "🎯", title: "Smart gate selection", desc: "Paywall, metered, ad-gate — routed per reader." },
              { icon: "📊", title: "Revenue analytics", desc: "See exactly what each gate earns." },
            ].map((f) => (
              <div key={f.title} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fff", border: "1px solid #ebebeb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", background: "#ebebeb" }}>
            {[{ v: "38 ms", l: "Decision time" }, { v: "4.1×", l: "Conversion lift" }, { v: "0 PII", l: "Reader data stored" }].map((s) => (
              <div key={s.l} style={{ padding: "14px 16px", background: "#fff" }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>{s.v}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
