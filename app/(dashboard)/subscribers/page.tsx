"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw, Users2 } from "lucide-react"

type Subscriber = {
  subscriberId: string
  email: string
  interval: string
  status: string
  since: string
  currentPeriodEnd: string | null
  cancelledAt: string | null
  dunningStartedAt: string | null
  razorpaySubscriptionId: string
}

type Stats = {
  total: number
  active: number
  past_due: number
  paused: number
  cancelled: number
}

const INTERVAL_LABELS: Record<string, string> = {
  monthly:   "Monthly",
  quarterly: "Quarterly",
  annual:    "Annual",
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  active:        { bg: "#f0fdf4", color: "#16a34a", label: "Active" },
  authenticated: { bg: "#f0fdf4", color: "#16a34a", label: "Active" },
  past_due:      { bg: "#fff7ed", color: "#ea580c", label: "Past due" },
  paused:        { bg: "#fefce8", color: "#ca8a04", label: "Paused" },
  cancelled:     { bg: "#fef2f2", color: "#dc2626", label: "Cancelled" },
  created:       { bg: "#f5f5f5", color: "#888",    label: "Pending" },
}

function statusStyle(status: string) {
  return STATUS_COLORS[status] ?? { bg: "#f5f5f5", color: "#888", label: status }
}

function fmtDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function tenure(since: string) {
  const ms = Date.now() - new Date(since).getTime()
  const days = Math.floor(ms / 86_400_000)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years}y ${rem}mo` : `${years}y`
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set("status", statusFilter)
    const res = await fetch(`/api/subscribers?${params}`)
    if (res.ok) {
      const data = await res.json()
      setSubscribers(data.subscribers ?? [])
      setStats(data.stats ?? null)
    }
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const STAT_ITEMS = stats ? [
    { label: "Total",     value: stats.total },
    { label: "Active",    value: stats.active },
    { label: "Past due",  value: stats.past_due },
    { label: "Paused",    value: stats.paused },
    { label: "Cancelled", value: stats.cancelled },
  ] : [
    { label: "Total",     value: "—" },
    { label: "Active",    value: "—" },
    { label: "Past due",  value: "—" },
    { label: "Paused",    value: "—" },
    { label: "Cancelled", value: "—" },
  ]

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Subscribers</h1>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Readers who have an active or past subscription to your publication.</p>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        {STAT_ITEMS.map((s, i) => (
          <div key={s.label} style={{ padding: "15px 20px", borderRight: i < STAT_ITEMS.length - 1 ? "1px solid #ebebeb" : "none", background: "#fff" }}>
            <div style={{ fontSize: 11, color: "#aaa", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ border: "1px solid #ddd", borderRadius: 6, padding: "5px 10px", fontSize: 12, color: "#555", background: "#fff", fontFamily: "inherit", cursor: "pointer" }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="past_due">Past due</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button onClick={load} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, border: "none", background: "none", cursor: "pointer", color: "#aaa", fontSize: 12 }}>
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
        {/* Head */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 100px 100px 110px 130px 160px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
          {["Email", "Plan", "Status", "Member since", "Next renewal", "Subscription ID"].map((h, i) => (
            <div key={i} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>

        {loading ? (
          [0,1,2,3].map(i => (
            <div key={i} style={{ padding: "13px 18px", borderBottom: i < 3 ? "1px solid #f5f5f5" : "none", display: "flex", gap: 20, alignItems: "center" }}>
              <div style={{ flex: 1, height: 12, background: "#f0f0f0", borderRadius: 4 }} />
              <div style={{ width: 80, height: 12, background: "#f0f0f0", borderRadius: 4 }} />
              <div style={{ width: 60, height: 12, background: "#f0f0f0", borderRadius: 4 }} />
            </div>
          ))
        ) : subscribers.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "72px 32px", textAlign: "center" }}>
            <Users2 size={36} stroke="#ddd" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 500, color: "#888", marginBottom: 5 }}>No subscribers yet</div>
            <div style={{ fontSize: 12, color: "#bbb", maxWidth: 300, lineHeight: 1.6 }}>
              Subscribers appear here once readers complete a subscription through one of your gates.
            </div>
          </div>
        ) : (
          subscribers.map((sub, i) => {
            const st = statusStyle(sub.status)
            return (
              <div
                key={sub.subscriberId}
                style={{ display: "grid", gridTemplateColumns: "2fr 100px 100px 110px 130px 160px", padding: "11px 18px", borderBottom: i < subscribers.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center", background: "#fff" }}
              >
                <div>
                  <div style={{ fontSize: 13, color: "#333" }}>{sub.email}</div>
                  <div style={{ fontSize: 11, color: "#bbb", marginTop: 1 }}>Since {fmtDate(sub.since)} · {tenure(sub.since)}</div>
                </div>

                <div style={{ fontSize: 12, color: "#555" }}>
                  {INTERVAL_LABELS[sub.interval] ?? sub.interval}
                </div>

                <div>
                  <span style={{ fontSize: 12, background: st.bg, color: st.color, borderRadius: 4, padding: "2px 7px", fontWeight: 500 }}>
                    {st.label}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: "#555" }}>
                  {fmtDate(sub.since)}
                </div>

                <div style={{ fontSize: 12, color: "#555" }}>
                  {sub.status === "cancelled" ? (
                    <span style={{ color: "#bbb" }}>—</span>
                  ) : (
                    fmtDate(sub.currentPeriodEnd)
                  )}
                </div>

                <div style={{ fontSize: 11, color: "#aaa", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {sub.razorpaySubscriptionId}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
