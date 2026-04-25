"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Something went wrong.")
        return
      }
      setSent(true)
    } catch {
      setError("Could not reach the server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#fff", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 360 }}>
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

        {sent ? (
          <div>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f0faf4", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#27adb0" strokeWidth={2} strokeLinecap="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111", marginBottom: 8 }}>Check your inbox</h1>
            <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 24 }}>
              If <strong style={{ color: "#555" }}>{email}</strong> is linked to an account, you'll receive a reset link shortly. It expires in 1 hour.
            </p>
            <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "#27adb0", textDecoration: "none" }}>
              <ArrowLeft size={13} /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "#111", marginBottom: 6 }}>Forgot password?</h1>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 28, lineHeight: 1.6 }}>
              Enter your email and we'll send you a link to reset your password.
            </p>

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
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: 13,
                    border: "1px solid",
                    borderColor: focused ? "#555" : "#e5e5e5",
                    borderRadius: 6,
                    outline: "none",
                    background: "#fff",
                    color: "#111",
                    fontFamily: "inherit",
                    transition: "border-color 0.12s",
                  }}
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
                style={{ padding: "8px", borderRadius: 6, fontSize: 13, fontWeight: 600, background: loading ? "#555" : "#111", color: "#fff", border: "none", cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <div style={{ marginTop: 20 }}>
              <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "#888", textDecoration: "none" }}>
                <ArrowLeft size={13} /> Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
