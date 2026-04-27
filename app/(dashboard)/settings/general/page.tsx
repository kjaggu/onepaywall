"use client"

import { useEffect, useState } from "react"
import { Check, Save } from "lucide-react"

const CURRENCIES = [
  { code: "INR", label: "INR — Indian Rupee (₹)" },
  { code: "USD", label: "USD — US Dollar ($)" },
  { code: "EUR", label: "EUR — Euro (€)" },
  { code: "GBP", label: "GBP — British Pound (£)" },
  { code: "SGD", label: "SGD — Singapore Dollar (S$)" },
  { code: "AED", label: "AED — UAE Dirham (د.إ)" },
  { code: "AUD", label: "AUD — Australian Dollar (A$)" },
  { code: "CAD", label: "CAD — Canadian Dollar (C$)" },
  { code: "JPY", label: "JPY — Japanese Yen (¥)" },
]

const TIMEZONES = [
  { value: "Asia/Kolkata",       label: "Asia/Kolkata — IST (UTC+5:30)" },
  { value: "UTC",                label: "UTC (UTC+0)" },
  { value: "America/New_York",   label: "America/New_York — EST/EDT" },
  { value: "America/Chicago",    label: "America/Chicago — CST/CDT" },
  { value: "America/Denver",     label: "America/Denver — MST/MDT" },
  { value: "America/Los_Angeles",label: "America/Los_Angeles — PST/PDT" },
  { value: "Europe/London",      label: "Europe/London — GMT/BST" },
  { value: "Europe/Paris",       label: "Europe/Paris — CET/CEST" },
  { value: "Europe/Berlin",      label: "Europe/Berlin — CET/CEST" },
  { value: "Asia/Dubai",         label: "Asia/Dubai — GST (UTC+4)" },
  { value: "Asia/Singapore",     label: "Asia/Singapore — SGT (UTC+8)" },
  { value: "Asia/Tokyo",         label: "Asia/Tokyo — JST (UTC+9)" },
  { value: "Asia/Shanghai",      label: "Asia/Shanghai — CST (UTC+8)" },
  { value: "Australia/Sydney",   label: "Australia/Sydney — AEST/AEDT" },
  { value: "Pacific/Auckland",   label: "Pacific/Auckland — NZST/NZDT" },
]

type Publisher = {
  id: string
  name: string
  currency: string
  timezone: string
}

export default function GeneralSettingsPage() {
  const [publisher, setPublisher] = useState<Publisher | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/publisher-settings")
      .then(r => r.json())
      .then(d => { setPublisher(d.publisher); setLoading(false) })
  }, [])

  async function save() {
    if (!publisher) return
    setSaving(true)
    setError(null)
    const res = await fetch("/api/publisher-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: publisher.name, currency: publisher.currency, timezone: publisher.timezone }),
    })
    if (res.ok) {
      const data = await res.json()
      setPublisher(data.publisher)
      setSaved(true)
      setTimeout(() => setSaved(false), 2200)
    } else {
      setError("Failed to save settings.")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{ padding: "28px 32px" }}>
        <div style={{ width: 180, height: 20, background: "#f0f0f0", borderRadius: 4, marginBottom: 6 }} />
        <div style={{ width: 280, height: 12, background: "#f5f5f5", borderRadius: 4 }} />
      </div>
    )
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 560 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>General settings</h1>
        <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
          Currency and timezone are applied to all revenue calculations, analytics, and reports.
        </p>
      </div>

      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        {/* Org name */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 6 }}>
            Organisation name
          </label>
          <input
            type="text"
            value={publisher?.name ?? ""}
            onChange={e => publisher && setPublisher({ ...publisher, name: e.target.value })}
            style={{ width: "100%", border: "1px solid #ddd", borderRadius: 6, padding: "7px 10px", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            className="focus:border-[#111] transition-colors"
          />
        </div>

        {/* Currency */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 4 }}>
            Currency
          </label>
          <p style={{ fontSize: 11, color: "#aaa", marginBottom: 8 }}>
            Used for displaying all revenue figures and setting prices in Plans.
          </p>
          <select
            value={publisher?.currency ?? "INR"}
            onChange={e => publisher && setPublisher({ ...publisher, currency: e.target.value })}
            style={{ width: "100%", border: "1px solid #ddd", borderRadius: 6, padding: "7px 10px", fontSize: 13, color: "#111", background: "#fff", fontFamily: "inherit", cursor: "pointer", outline: "none", boxSizing: "border-box" }}
            className="focus:border-[#111]"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Timezone */}
        <div style={{ padding: "16px 20px" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 4 }}>
            Timezone
          </label>
          <p style={{ fontSize: 11, color: "#aaa", marginBottom: 8 }}>
            Used for analytics date grouping, rollup windows, and reporting periods.
          </p>
          <select
            value={publisher?.timezone ?? "Asia/Kolkata"}
            onChange={e => publisher && setPublisher({ ...publisher, timezone: e.target.value })}
            style={{ width: "100%", border: "1px solid #ddd", borderRadius: 6, padding: "7px 10px", fontSize: 13, color: "#111", background: "#fff", fontFamily: "inherit", cursor: "pointer", outline: "none", boxSizing: "border-box" }}
            className="focus:border-[#111]"
          >
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: "#e54", marginBottom: 10 }}>{error}</div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 18px",
            borderRadius: 6,
            background: saved ? "#22c55e" : "#111",
            color: "#fff",
            border: "none",
            fontSize: 13,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            transition: "background 0.2s",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? "Saved" : saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  )
}
