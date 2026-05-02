"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import type { AdminSubscriptionRow } from "@/lib/db/queries/admin"

const statusStyle: Record<string, { bg: string; color: string }> = {
  active:   { bg: "#f0faf4", color: "#27adb0" },
  trialing: { bg: "#fff8ed", color: "#945d00" },
  past_due: { bg: "#fdecea", color: "#c0392b" },
}
const planColorMap: Record<string, { bg: string; color: string }> = {
  trial:   { bg: "#f5f5f5", color: "#888"    },
  lite:    { bg: "#f5f5f5", color: "#666"    },
  starter: { bg: "#eff3ff", color: "#3451b2" },
  growth:  { bg: "#f0fdf8", color: "#166534" },
  scale:   { bg: "#faf5ff", color: "#6b21a8" },
}

function fmtINR(paise: number | null) {
  if (paise == null) return "—"
  return "₹" + (paise / 100).toLocaleString("en-IN")
}

function fmtDate(d: string | Date | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState("")
  const [filter, setFilter]   = useState<"all" | "active" | "trialing" | "past_due">("all")

  useEffect(() => {
    fetch("/api/admin/subscriptions")
      .then(r => r.json())
      .then(d => setSubscriptions(d.subscriptions ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = subscriptions.filter(s => {
    const matchSearch = s.publisherName.toLowerCase().includes(search.toLowerCase()) || s.publisherSlug.includes(search.toLowerCase())
    const matchFilter = filter === "all" || s.status === filter
    return matchSearch && matchFilter
  })

  const activeSubs  = subscriptions.filter(s => s.status === "active")
  const totalMRR    = activeSubs.reduce((sum, s) => sum + (s.priceMonthly ?? 0), 0)
  const counts = {
    active:   subscriptions.filter(s => s.status === "active").length,
    trialing: subscriptions.filter(s => s.status === "trialing").length,
    past_due: subscriptions.filter(s => s.status === "past_due").length,
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Subscriptions</h1>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
            Platform recurring revenue · MRR {loading ? "…" : fmtINR(totalMRR)}
          </p>
        </div>
        <button style={{ padding: "6px 12px", borderRadius: 6, background: "#111", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          Export CSV
        </button>
      </div>

      {/* Stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        {[
          { label: "Total MRR",  value: loading ? "…" : fmtINR(totalMRR),          sub: "active subscriptions only"              },
          { label: "Active",     value: loading ? "…" : String(counts.active),      sub: "billing normally"                       },
          { label: "Trialing",   value: loading ? "…" : String(counts.trialing),    sub: "free trial period"                      },
          { label: "Past due",   value: loading ? "…" : String(counts.past_due),    sub: "payment failed", warn: counts.past_due > 0 },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: "15px 20px", borderRight: i < 3 ? "1px solid #ebebeb" : "none", background: "#fff" }}>
            <div style={{ fontSize: 11, color: "#aaa", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: s.warn ? "#c0392b" : "#111", letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#ccc", marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs + search */}
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "10px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 2 }}>
            {(["all", "active", "trialing", "past_due"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: "4px 10px", borderRadius: 5, border: "none", fontSize: 12, fontWeight: filter === f ? 600 : 400, color: filter === f ? "#111" : "#888", background: filter === f ? "#f0f0f0" : "transparent", cursor: "pointer", fontFamily: "inherit" }}>
                {f === "all" ? "All" : f === "past_due" ? "Past due" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <Search size={13} stroke="#ccc" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search publishers…"
            style={{ border: "none", outline: "none", fontSize: 13, color: "#333", background: "transparent", fontFamily: "inherit", width: 180 }} />
        </div>

        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 88px 100px 120px 80px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
          {["Publisher", "Plan", "Status", "MRR", "Period end", ""].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>

        {loading && (
          <div style={{ padding: "32px 18px", textAlign: "center", color: "#bbb", fontSize: 13 }}>Loading…</div>
        )}

        {!loading && filtered.map((s, i) => {
          const ss = statusStyle[s.status] ?? statusStyle.active
          const pc = planColorMap[s.planSlug] ?? planColorMap.lite
          return (
            <div key={s.id} className="row-hover transition-colors duration-[80ms]"
              style={{ display: "grid", gridTemplateColumns: "2fr 80px 88px 100px 120px 80px", padding: "10px 18px", borderBottom: i < filtered.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center", background: "#fff" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{s.publisherName}</div>
                <div style={{ fontSize: 10, color: "#ccc", marginTop: 1 }}>{s.publisherSlug}</div>
              </div>
              <div><span style={{ padding: "2px 7px", borderRadius: 3, background: pc.bg, color: pc.color, fontSize: 10, fontWeight: 500 }}>{s.planName}</span></div>
              <div><span style={{ padding: "2px 7px", borderRadius: 3, background: ss.bg, color: ss.color, fontSize: 10, fontWeight: 500 }}>
                {s.status === "past_due" ? "Past due" : s.status.charAt(0).toUpperCase() + s.status.slice(1)}
              </span></div>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{fmtINR(s.priceMonthly)}</span>
              <span style={{ fontSize: 12, color: "#666" }}>{fmtDate(s.currentPeriodEnd)}</span>
              <button style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #e5e5e5", background: "#fff", fontSize: 11, fontWeight: 500, color: "#555", cursor: "pointer", fontFamily: "inherit" }}>
                Manage
              </button>
            </div>
          )
        })}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: "32px 18px", textAlign: "center", color: "#bbb", fontSize: 13 }}>No subscriptions match your search.</div>
        )}
      </div>
    </div>
  )
}
