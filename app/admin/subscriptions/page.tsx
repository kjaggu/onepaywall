"use client"

import { useState } from "react"
import { Search } from "lucide-react"

const SUBSCRIPTIONS = [
  { id: "sub_1", publisher: "IndiaInk Media",      slug: "indiaink",   plan: "Scale",   status: "active",   mrr: 1999900, startDate: "3 Mar 2026",  nextBilling: "3 May 2026",  paymentMethod: "Card •••• 4242", billingCycles: 3 },
  { id: "sub_2", publisher: "FinMedia Group",       slug: "finmedia",   plan: "Growth",  status: "active",   mrr: 799900,  startDate: "12 Apr 2026", nextBilling: "12 May 2026", paymentMethod: "Card •••• 1881", billingCycles: 1 },
  { id: "sub_3", publisher: "The Courier",          slug: "thecourier", plan: "Growth",  status: "active",   mrr: 799900,  startDate: "15 Feb 2026", nextBilling: "15 May 2026", paymentMethod: "Card •••• 9074", billingCycles: 3 },
  { id: "sub_4", publisher: "TechWeekly",           slug: "techweekly", plan: "Starter", status: "past_due", mrr: 299900,  startDate: "8 Apr 2026",  nextBilling: "8 May 2026",  paymentMethod: "Card •••• 3311", billingCycles: 1 },
  { id: "sub_5", publisher: "DiveWire",             slug: "divewire",   plan: "Starter", status: "active",   mrr: 299900,  startDate: "20 Mar 2026", nextBilling: "20 May 2026", paymentMethod: "Card •••• 5523", billingCycles: 2 },
  { id: "sub_6", publisher: "DeepDive Science",     slug: "deepdive",   plan: "Starter", status: "trialing", mrr: 299900,  startDate: "24 Apr 2026", nextBilling: "24 May 2026", paymentMethod: "—",              billingCycles: 0 },
  { id: "sub_7", publisher: "Local Press Network",  slug: "localpress", plan: "Lite",    status: "active",   mrr: 149900,  startDate: "1 Apr 2026",  nextBilling: "1 May 2026",  paymentMethod: "Card •••• 8801", billingCycles: 1 },
  { id: "sub_8", publisher: "PressHub",             slug: "presshub",   plan: "Lite",    status: "active",   mrr: 149900,  startDate: "22 Apr 2026", nextBilling: "22 May 2026", paymentMethod: "Card •••• 2290", billingCycles: 1 },
]

const statusStyle: Record<string, { bg: string; color: string }> = {
  active:   { bg: "#f0faf4", color: "#27adb0" },
  trialing: { bg: "#fff8ed", color: "#945d00" },
  past_due: { bg: "#fdecea", color: "#c0392b" },
}
const planStyle: Record<string, { bg: string; color: string }> = {
  Lite:    { bg: "#f5f5f5", color: "#666"    },
  Starter: { bg: "#eff3ff", color: "#3451b2" },
  Growth:  { bg: "#f0fdf8", color: "#166534" },
  Scale:   { bg: "#faf5ff", color: "#6b21a8" },
}

function fmt(paise: number) {
  return "₹" + (paise / 100).toLocaleString("en-IN")
}

export default function SubscriptionsPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "trialing" | "past_due">("all")

  const filtered = SUBSCRIPTIONS.filter(s => {
    const matchSearch = s.publisher.toLowerCase().includes(search.toLowerCase()) || s.slug.includes(search.toLowerCase())
    const matchFilter = filter === "all" || s.status === filter
    return matchSearch && matchFilter
  })

  const totalMRR = SUBSCRIPTIONS.filter(s => s.status === "active").reduce((sum, s) => sum + s.mrr, 0)
  const counts = {
    active:   SUBSCRIPTIONS.filter(s => s.status === "active").length,
    trialing: SUBSCRIPTIONS.filter(s => s.status === "trialing").length,
    past_due: SUBSCRIPTIONS.filter(s => s.status === "past_due").length,
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Subscriptions</h1>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Platform recurring revenue · MRR {fmt(totalMRR)}</p>
        </div>
        <button style={{ padding: "6px 12px", borderRadius: 6, background: "#111", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          Export CSV
        </button>
      </div>

      {/* Stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        {[
          { label: "Total MRR",      value: fmt(totalMRR),          sub: "active subscriptions only" },
          { label: "Active",         value: String(counts.active),  sub: "billing normally"          },
          { label: "Trialing",       value: String(counts.trialing),sub: "free trial period"         },
          { label: "Past due",       value: String(counts.past_due),sub: "payment failed",  warn: counts.past_due > 0 },
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
        <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 88px 100px 120px 60px 80px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
          {["Publisher", "Plan", "Status", "MRR", "Next billing", "Cycles", ""].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>

        {filtered.map((s, i) => {
          const ss = statusStyle[s.status] ?? statusStyle.active
          const ps = planStyle[s.plan] ?? planStyle.Lite
          return (
            <div key={s.id} className="row-hover transition-colors duration-[80ms]"
              style={{ display: "grid", gridTemplateColumns: "2fr 80px 88px 100px 120px 60px 80px", padding: "10px 18px", borderBottom: i < filtered.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center", background: "#fff" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{s.publisher}</div>
                <div style={{ fontSize: 10, color: "#ccc", marginTop: 1 }}>{s.paymentMethod}</div>
              </div>
              <div><span style={{ padding: "2px 7px", borderRadius: 3, background: ps.bg, color: ps.color, fontSize: 10, fontWeight: 500 }}>{s.plan}</span></div>
              <div><span style={{ padding: "2px 7px", borderRadius: 3, background: ss.bg, color: ss.color, fontSize: 10, fontWeight: 500 }}>{s.status === "past_due" ? "Past due" : s.status.charAt(0).toUpperCase() + s.status.slice(1)}</span></div>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{fmt(s.mrr)}</span>
              <span style={{ fontSize: 12, color: "#666" }}>{s.nextBilling}</span>
              <span style={{ fontSize: 12, color: "#888" }}>{s.billingCycles}</span>
              <button style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #e5e5e5", background: "#fff", fontSize: 11, fontWeight: 500, color: "#555", cursor: "pointer", fontFamily: "inherit" }}>
                Manage
              </button>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div style={{ padding: "32px 18px", textAlign: "center", color: "#bbb", fontSize: 13 }}>No subscriptions match your search.</div>
        )}
      </div>
    </div>
  )
}
