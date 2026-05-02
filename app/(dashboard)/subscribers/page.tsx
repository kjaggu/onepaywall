"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { RefreshCw, Users2, MoreHorizontal } from "lucide-react"
import { AddSubscriberSheet } from "@/components/dashboard/subscribers/add-subscriber-sheet"
import { ImportSubscribersSheet } from "@/components/dashboard/subscribers/import-subscribers-sheet"

type Subscriber = {
  id: string
  subscriberId: string
  email: string
  interval: string
  status: string
  source: string
  since: string
  currentPeriodEnd: string | null
  cancelledAt: string | null
  dunningStartedAt: string | null
  razorpaySubscriptionId: string | null
  paymentMethod: string | null
  notes: string | null
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
  lifetime:  "Lifetime",
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  upi:           "UPI",
  netbanking:    "Netbanking",
  card:          "Card",
  cash:          "Cash",
  bank_transfer: "Bank transfer",
  complimentary: "Complimentary",
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  active:        { bg: "#f0fdf4", color: "#16a34a", label: "Active" },
  authenticated: { bg: "#f0fdf4", color: "#16a34a", label: "Active" },
  past_due:      { bg: "#fff7ed", color: "#ea580c", label: "Past due" },
  paused:        { bg: "#fefce8", color: "#ca8a04", label: "Paused" },
  cancelled:     { bg: "#fef2f2", color: "#dc2626", label: "Cancelled" },
  created:       { bg: "#f5f5f5", color: "#888",    label: "Pending" },
}

function statusStyle(status: string) {
  return STATUS_STYLE[status] ?? { bg: "#f5f5f5", color: "#888", label: status }
}

function fmtDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function tenure(since: string) {
  const days = Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years}y ${rem}mo` : `${years}y`
}

// Simple row action dropdown
function RowActions({ sub, onAction }: { sub: Subscriber; onAction: (id: string, action: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const canCancel = sub.status !== "cancelled"
  const canPause  = sub.status === "active" || sub.status === "authenticated" || sub.status === "past_due"
  const canActivate = sub.status === "paused" || sub.status === "cancelled"

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ padding: "4px 6px", border: "none", background: "none", cursor: "pointer", color: "#aaa", borderRadius: 4, display: "flex", alignItems: "center" }}
        title="Actions"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "100%", zIndex: 50,
          background: "#fff", border: "1px solid #e5e5e5", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)", minWidth: 130, padding: "4px 0",
        }}>
          {canActivate && (
            <button onClick={() => { onAction(sub.id, "activate"); setOpen(false) }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 14px", fontSize: 13, color: "#16a34a", background: "none", border: "none", cursor: "pointer" }}>
              Activate
            </button>
          )}
          {canPause && (
            <button onClick={() => { onAction(sub.id, "pause"); setOpen(false) }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 14px", fontSize: 13, color: "#ca8a04", background: "none", border: "none", cursor: "pointer" }}>
              Pause
            </button>
          )}
          {canCancel && (
            <button onClick={() => { onAction(sub.id, "cancel"); setOpen(false) }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "7px 14px", fontSize: 13, color: "#dc2626", background: "none", border: "none", cursor: "pointer" }}>
              Cancel
            </button>
          )}
          {!canCancel && !canPause && !canActivate && (
            <div style={{ padding: "7px 14px", fontSize: 12, color: "#bbb" }}>No actions</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkPending, setBulkPending] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setSelected(new Set())
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

  async function handleRowAction(subscriptionId: string, action: string) {
    await fetch(`/api/subscribers/${subscriptionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    load()
  }

  async function handleBulkAction(action: "cancel" | "pause") {
    if (selected.size === 0) return
    setBulkPending(true)
    await fetch("/api/subscribers/bulk-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionIds: [...selected], action }),
    })
    setBulkPending(false)
    load()
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === subscribers.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(subscribers.map(s => s.id)))
    }
  }

  const STAT_ITEMS = stats ? [
    { label: "Total",     value: stats.total },
    { label: "Active",    value: stats.active },
    { label: "Past due",  value: stats.past_due },
    { label: "Paused",    value: stats.paused },
    { label: "Cancelled", value: stats.cancelled },
  ] : Array.from({ length: 5 }, (_, i) => ({ label: ["Total","Active","Past due","Paused","Cancelled"][i], value: "—" as string | number }))

  const allSelected = subscribers.length > 0 && selected.size === subscribers.length

  return (
    <div>
      {/* Header actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16, gap: 8 }}>
        <ImportSubscribersSheet onImported={load} />
        <AddSubscriberSheet onAdded={load} />
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

      {/* Filters + bulk actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
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

        {selected.size > 0 && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginLeft: 8 }}>
            <span style={{ fontSize: 12, color: "#555" }}>{selected.size} selected</span>
            <button
              onClick={() => handleBulkAction("pause")}
              disabled={bulkPending}
              style={{ padding: "5px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 12, background: "#fff", cursor: "pointer", color: "#ca8a04" }}
            >
              Pause
            </button>
            <button
              onClick={() => handleBulkAction("cancel")}
              disabled={bulkPending}
              style={{ padding: "5px 12px", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 12, background: "#fff", cursor: "pointer", color: "#dc2626" }}
            >
              Cancel
            </button>
          </div>
        )}

        <button onClick={load} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, border: "none", background: "none", cursor: "pointer", color: "#aaa", fontSize: 12 }}>
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
        {/* Head */}
        <div style={{ display: "grid", gridTemplateColumns: "28px 2fr 90px 90px 100px 110px 120px 110px 36px", padding: "7px 14px 7px 10px", background: "#fafafa", borderBottom: "1px solid #ebebeb", alignItems: "center" }}>
          <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ cursor: "pointer" }} />
          {["Email","Plan","Method","Status","Since","Expires","Source"].map((h) => (
            <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
          ))}
          <div />
        </div>

        {loading ? (
          [0,1,2,3].map(i => (
            <div key={i} style={{ padding: "13px 18px", borderBottom: i < 3 ? "1px solid #f5f5f5" : "none", display: "flex", gap: 20, alignItems: "center" }}>
              <div style={{ width: 16, height: 12, background: "#f0f0f0", borderRadius: 3 }} />
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
              Add individual subscribers or import a CSV to get started.
            </div>
          </div>
        ) : (
          subscribers.map((sub, i) => {
            const st = statusStyle(sub.status)
            const isSelected = selected.has(sub.id)
            const isManual = sub.source === "manual"
            return (
              <div
                key={sub.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "28px 2fr 90px 90px 100px 110px 120px 110px 36px",
                  padding: "10px 14px 10px 10px",
                  borderBottom: i < subscribers.length - 1 ? "1px solid #f5f5f5" : "none",
                  alignItems: "center",
                  background: isSelected ? "#fafafa" : "#fff",
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(sub.id)}
                  style={{ cursor: "pointer" }}
                />

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub.email}</div>
                  {sub.notes && (
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={sub.notes}>
                      {sub.notes}
                    </div>
                  )}
                  {!sub.notes && (
                    <div style={{ fontSize: 11, color: "#bbb", marginTop: 1 }}>
                      {tenure(sub.since)}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 12, color: "#555" }}>
                  {INTERVAL_LABELS[sub.interval] ?? sub.interval}
                </div>

                <div style={{ fontSize: 12, color: "#555" }}>
                  {sub.paymentMethod ? (PAYMENT_METHOD_LABELS[sub.paymentMethod] ?? sub.paymentMethod.replace("_"," ")) : "—"}
                </div>

                <div>
                  <span style={{ fontSize: 11, background: st.bg, color: st.color, borderRadius: 4, padding: "2px 7px", fontWeight: 500, whiteSpace: "nowrap" }}>
                    {st.label}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: "#555" }}>
                  {fmtDate(sub.since)}
                </div>

                <div style={{ fontSize: 12, color: sub.status === "cancelled" ? "#bbb" : "#555" }}>
                  {sub.interval === "lifetime" ? "Never" : fmtDate(sub.currentPeriodEnd)}
                </div>

                <div style={{ fontSize: 11 }}>
                  {isManual ? (
                    <span style={{ background: "#f5f5f5", color: "#888", borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 500 }}>
                      Manual
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, color: "#bbb", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", display: "block", whiteSpace: "nowrap" }}
                      title={sub.razorpaySubscriptionId ?? ""}>
                      {sub.razorpaySubscriptionId?.slice(0, 10) ?? "—"}…
                    </span>
                  )}
                </div>

                <RowActions sub={sub} onAction={handleRowAction} />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
