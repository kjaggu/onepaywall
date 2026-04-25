"use client"

import { useState } from "react"
import { Plus, Search } from "lucide-react"
import Link from "next/link"

const PUBLISHERS = [
  { id: "1", name: "FinMedia Group",       slug: "finmedia",   plan: "Growth",  domains: 9,  members: 4, mrr: "₹7,999",  mau: "84,200",   status: "active",   joined: "12 Apr 2026" },
  { id: "2", name: "IndiaInk Media",       slug: "indiaink",   plan: "Scale",   domains: 24, members: 9, mrr: "₹19,999", mau: "4,10,000", status: "active",   joined: "3 Mar 2026"  },
  { id: "3", name: "TechWeekly",           slug: "techweekly", plan: "Starter", domains: 3,  members: 2, mrr: "₹2,999",  mau: "22,100",   status: "past_due", joined: "8 Apr 2026"  },
  { id: "4", name: "DeepDive Science",     slug: "deepdive",   plan: "Starter", domains: 2,  members: 1, mrr: "₹2,999",  mau: "11,800",   status: "trialing", joined: "24 Apr 2026" },
  { id: "5", name: "Local Press Network",  slug: "localpress", plan: "Lite",    domains: 1,  members: 1, mrr: "₹0",      mau: "3,200",    status: "active",   joined: "1 Apr 2026"  },
  { id: "6", name: "The Courier",          slug: "thecourier", plan: "Growth",  domains: 7,  members: 5, mrr: "₹7,999",  mau: "71,500",   status: "active",   joined: "15 Feb 2026" },
  { id: "7", name: "DiveWire",             slug: "divewire",   plan: "Starter", domains: 2,  members: 2, mrr: "₹2,999",  mau: "18,900",   status: "active",   joined: "20 Mar 2026" },
  { id: "8", name: "PressHub",             slug: "presshub",   plan: "Lite",    domains: 1,  members: 1, mrr: "₹0",      mau: "1,900",    status: "active",   joined: "22 Apr 2026" },
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

export default function PublishersPage() {
  const [search, setSearch] = useState("")
  const filtered = PUBLISHERS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Publishers</h1>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{PUBLISHERS.length} organisations · {PUBLISHERS.filter(p => p.status === "active").length} active</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, background: "#111", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          <Plus size={14} />
          Add publisher
        </button>
      </div>

      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "10px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", gap: 8 }}>
          <Search size={13} stroke="#ccc" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search publishers…"
            style={{ border: "none", outline: "none", fontSize: 13, color: "#333", background: "transparent", fontFamily: "inherit", flex: 1 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 60px 64px 88px 80px 80px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
          {["Publisher", "Plan", "Domains", "Members", "MAU", "MRR", "Status"].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>
        {filtered.map((p, i) => {
          const ss = statusStyle[p.status] ?? statusStyle.active
          const ps = planStyle[p.plan] ?? planStyle.Lite
          return (
            <Link key={p.id} href={`/admin/publishers/${p.id}`}
              className="row-hover transition-colors duration-[80ms]"
              style={{ display: "grid", gridTemplateColumns: "2fr 80px 60px 64px 88px 80px 80px", padding: "10px 18px", borderBottom: i < filtered.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center", background: "#fff", textDecoration: "none" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{p.name}</div>
                <div style={{ fontSize: 10, color: "#ccc", marginTop: 1 }}>{p.slug}</div>
              </div>
              <div><span style={{ padding: "2px 7px", borderRadius: 3, background: ps.bg, color: ps.color, fontSize: 10, fontWeight: 500 }}>{p.plan}</span></div>
              <span style={{ fontSize: 12, color: "#666" }}>{p.domains}</span>
              <span style={{ fontSize: 12, color: "#666" }}>{p.members}</span>
              <span style={{ fontSize: 12, color: "#666" }}>{p.mau}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#111" }}>{p.mrr}</span>
              <div><span style={{ padding: "2px 7px", borderRadius: 3, background: ss.bg, color: ss.color, fontSize: 10, fontWeight: 500 }}>{p.status}</span></div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
