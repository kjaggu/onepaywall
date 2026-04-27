"use client"

import { useCallback, useEffect, useState } from "react"
import { Download, DollarSign, RefreshCw } from "lucide-react"

type Transaction = {
  id: string
  type: "subscription" | "one_time_unlock"
  status: "pending" | "completed" | "refunded" | "failed"
  amount: number
  currency: string
  razorpayPaymentId: string | null
  contentUrl: string | null
  readerId: string | null
  domainId: string | null
  domainName: string | null
  domainHost: string | null
  createdAt: string
}

type Summary = {
  total: number
  subs: number
  unlocks: number
  recentTotal: number
  count: number
}

const TYPE_LABELS: Record<Transaction["type"], string> = {
  subscription:    "Subscription",
  one_time_unlock: "Article unlock",
}

const STATUS_COLORS: Record<Transaction["status"], string> = {
  completed: "#22c55e",
  pending:   "#f59e0b",
  refunded:  "#6366f1",
  failed:    "#ef4444",
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount / 100)
}

function exportCsv(rows: Transaction[]) {
  const headers = ["ID", "Date", "Type", "Status", "Amount", "Currency", "Domain", "Content URL", "Payment ID", "Reader ID"]
  const lines = rows.map(r => [
    r.id,
    new Date(r.createdAt).toISOString(),
    r.type,
    r.status,
    (r.amount / 100).toFixed(2),
    r.currency,
    r.domainHost ?? "",
    r.contentUrl ?? "",
    r.razorpayPaymentId ?? "",
    r.readerId ?? "",
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))

  const csv = [headers.join(","), ...lines].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href = url
  a.download = `revenue-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function RevenuePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<"" | "subscription" | "one_time_unlock">("")
  const [statusFilter, setStatusFilter] = useState<"" | "completed" | "refunded" | "pending" | "failed">("")

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (typeFilter)   params.set("type", typeFilter)
    if (statusFilter) params.set("status", statusFilter)
    const res = await fetch(`/api/revenue?${params}`)
    if (res.ok) {
      const data = await res.json()
      setTransactions(data.transactions ?? [])
      setSummary(data.summary ?? null)
    }
    setLoading(false)
  }, [typeFilter, statusFilter])

  useEffect(() => { load() }, [load])

  const STATS = summary ? [
    { label: "Total revenue",   value: fmt(summary.total, "INR") },
    { label: "Subscriptions",   value: fmt(summary.subs, "INR") },
    { label: "Article unlocks", value: fmt(summary.unlocks, "INR") },
    { label: "Last 30 days",    value: fmt(summary.recentTotal, "INR") },
  ] : [
    { label: "Total revenue",   value: "—" },
    { label: "Subscriptions",   value: "—" },
    { label: "Article unlocks", value: "—" },
    { label: "Last 30 days",    value: "—" },
  ]

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Revenue</h1>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Subscription and article unlock payments across all domains.</p>
        </div>
        <button
          onClick={() => exportCsv(transactions)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, background: "#fff", color: "#555", border: "1px solid #ddd", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        {STATS.map((s, i) => (
          <div key={s.label} style={{ padding: "15px 20px", borderRight: i < STATS.length - 1 ? "1px solid #ebebeb" : "none", background: "#fff" }}>
            <div style={{ fontSize: 11, color: "#aaa", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
          style={{ border: "1px solid #ddd", borderRadius: 6, padding: "5px 10px", fontSize: 12, color: "#555", background: "#fff", fontFamily: "inherit", cursor: "pointer" }}
        >
          <option value="">All types</option>
          <option value="subscription">Subscriptions</option>
          <option value="one_time_unlock">Article unlocks</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          style={{ border: "1px solid #ddd", borderRadius: 6, padding: "5px 10px", fontSize: 12, color: "#555", background: "#fff", fontFamily: "inherit", cursor: "pointer" }}
        >
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>

        <button onClick={load} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, border: "none", background: "none", cursor: "pointer", color: "#aaa", fontSize: 12 }}>
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
        {/* Head */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 120px 100px 130px 160px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
          {["Date", "Type", "Amount", "Status", "Domain", "Payment ID"].map((h, i) => (
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
        ) : transactions.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "72px 32px", textAlign: "center" }}>
            <DollarSign size={36} stroke="#ddd" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 500, color: "#888", marginBottom: 5 }}>No transactions yet</div>
            <div style={{ fontSize: 12, color: "#bbb", maxWidth: 300, lineHeight: 1.6 }}>
              Revenue appears here once readers complete payments through your gates.
            </div>
          </div>
        ) : (
          transactions.map((tx, i) => (
            <div
              key={tx.id}
              style={{ display: "grid", gridTemplateColumns: "1fr 110px 120px 100px 130px 160px", padding: "11px 18px", borderBottom: i < transactions.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center", background: "#fff" }}
            >
              <div>
                <div style={{ fontSize: 13, color: "#333" }}>{new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                <div style={{ fontSize: 11, color: "#bbb", marginTop: 1 }}>{new Date(tx.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
              </div>

              <div>
                <span style={{ fontSize: 12, background: tx.type === "subscription" ? "#eff6ff" : "#f0fdf4", color: tx.type === "subscription" ? "#3b82f6" : "#16a34a", borderRadius: 4, padding: "2px 7px", fontWeight: 500 }}>
                  {TYPE_LABELS[tx.type]}
                </span>
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>
                {fmt(tx.amount, tx.currency)}
                {tx.contentUrl && (
                  <div style={{ fontSize: 10, color: "#bbb", fontWeight: 400, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 110 }}>
                    {tx.contentUrl}
                  </div>
                )}
              </div>

              <div>
                <span style={{ fontSize: 12, color: STATUS_COLORS[tx.status], fontWeight: 500, textTransform: "capitalize" }}>
                  {tx.status}
                </span>
              </div>

              <div style={{ fontSize: 12, color: "#555" }}>
                {tx.domainHost ?? <span style={{ color: "#ccc" }}>—</span>}
              </div>

              <div style={{ fontSize: 11, color: "#aaa", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {tx.razorpayPaymentId ?? "—"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
