"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

function VerifyEmailContent() {
  const params = useSearchParams()
  const hasError = params.get("error") === "invalid"

  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState<string | null>(hasError ? "This verification link has expired or is invalid." : null)

  // Clear the error param from the URL without a full reload
  useEffect(() => {
    if (hasError) {
      const url = new URL(window.location.href)
      url.searchParams.delete("error")
      window.history.replaceState({}, "", url.toString())
    }
  }, [hasError])

  async function handleResend() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Something went wrong.")
        return
      }
      setResent(true)
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

        {/* Envelope icon */}
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <rect x={2} y={4} width={20} height={16} rx={2} />
            <path d="M2 7l10 7 10-7" />
          </svg>
        </div>

        <h1 style={{ fontSize: 21, fontWeight: 600, color: "#111", marginBottom: 8 }}>Check your email</h1>
        <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7, marginBottom: 24 }}>
          We sent a verification link to your email address. Click it to activate your account.
          The link expires in 24 hours.
        </p>

        {error && (
          <div style={{ padding: "9px 12px", borderRadius: 6, background: "#fef2f2", border: "1px solid #fca5a5", fontSize: 12, color: "#c0392b", marginBottom: 16 }}>
            {error}
          </div>
        )}

        {resent ? (
          <div style={{ padding: "9px 12px", borderRadius: 6, background: "#f0faf4", border: "1px solid #6ee7b7", fontSize: 12, color: "#065f46", marginBottom: 16 }}>
            Verification email resent — check your inbox.
          </div>
        ) : (
          <button
            onClick={handleResend}
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              background: loading ? "#e5e5e5" : "#f5f5f5",
              color: loading ? "#aaa" : "#111",
              border: "1px solid #e5e5e5",
              cursor: loading ? "default" : "pointer",
              fontFamily: "inherit",
              marginBottom: 16,
            }}
          >
            {loading ? "Sending…" : "Resend verification email"}
          </button>
        )}

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Link href="/login" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>
            Back to sign in
          </Link>
          <Link href="/overview" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>
            Already verified?
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
