"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  function inputStyle(name: string): React.CSSProperties {
    return {
      width: "100%",
      padding: "8px 12px",
      fontSize: 13,
      border: "1px solid",
      borderColor: focused === name ? "#555" : "#e5e5e5",
      borderRadius: 6,
      outline: "none",
      background: "#fff",
      color: "#111",
      fontFamily: "inherit",
      transition: "border-color 0.12s",
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.")
        return
      }
      setDone(true)
      setTimeout(() => router.push("/login"), 2500)
    } catch {
      setError("Could not reach the server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div>
        <p style={{ fontSize: 13, color: "#c0392b", marginBottom: 20 }}>Invalid or missing reset token.</p>
        <Link href="/forgot-password" style={{ fontSize: 13, color: "#27adb0", textDecoration: "none" }}>Request a new link</Link>
      </div>
    )
  }

  return done ? (
    <div>
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f0faf4", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#27adb0" strokeWidth={2} strokeLinecap="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111", marginBottom: 8 }}>Password updated</h1>
      <p style={{ fontSize: 13, color: "#888" }}>Redirecting you to sign in…</p>
    </div>
  ) : (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: "#111", marginBottom: 6 }}>Set new password</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 28 }}>Must be at least 8 characters.</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 5 }}>New password</label>
          <input type="password" placeholder="••••••••" value={password}
            onChange={e => setPassword(e.target.value)}
            onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
            style={inputStyle("password")} required />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 5 }}>Confirm password</label>
          <input type="password" placeholder="••••••••" value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onFocus={() => setFocused("confirm")} onBlur={() => setFocused(null)}
            style={inputStyle("confirm")} required />
        </div>

        {error && (
          <div style={{ padding: "9px 12px", borderRadius: 6, background: "#fef2f2", border: "1px solid #fca5a5", fontSize: 12, color: "#c0392b" }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          style={{ padding: "8px", borderRadius: 6, fontSize: 13, fontWeight: 600, background: loading ? "#555" : "#111", color: "#fff", border: "none", cursor: loading ? "default" : "pointer", fontFamily: "inherit" }}>
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>

      <div style={{ marginTop: 20 }}>
        <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "#888", textDecoration: "none" }}>
          <ArrowLeft size={13} /> Back to sign in
        </Link>
      </div>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div style={{ display: "flex", height: "100vh", background: "#fff", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 360 }}>
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
        <Suspense fallback={<div style={{ fontSize: 13, color: "#aaa" }}>Loading…</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
