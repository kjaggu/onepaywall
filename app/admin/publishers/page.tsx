"use client"

import { useEffect, useState } from "react"
import { Plus, Search } from "lucide-react"
import Link from "next/link"
import type { AdminPublisherRow } from "@/lib/db/queries/admin"

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

export default function PublishersPage() {
  const [publishers, setPublishers] = useState<AdminPublisherRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState("")

  useEffect(() => {
    fetch("/api/admin/publishers")
      .then(r => r.json())
      .then(d => setPublishers(d.publishers ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = publishers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Publishers</h1>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
            {loading ? "Loading…" : `${publishers.length} organisations · ${publishers.filter(p => p.subStatus === "active").length} active`}
          </p>
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
        <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 60px 64px 88px 80px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
          {["Publisher", "Plan", "Domains", "Members", "MRR", "Status"].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>

        {loading && (
          <div style={{ padding: "32px 18px", textAlign: "center", color: "#bbb", fontSize: 13 }}>Loading…</div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: "32px 18px", textAlign: "center", color: "#bbb", fontSize: 13 }}>
            {search ? "No publishers match your search." : "No publishers yet."}
          </div>
        )}

        {filtered.map((p, i) => {
          const ss = statusStyle[p.subStatus ?? ""] ?? statusStyle.active
          const pc = planColorMap[p.planSlug ?? ""] ?? planColorMap.lite
          const mrr = p.priceMonthly != null ? "₹" + (p.priceMonthly / 100).toLocaleString("en-IN") : "—"
          return (
            <Link key={p.id} href={`/admin/publishers/${p.id}`}
              className="row-hover transition-colors duration-[80ms]"
              style={{ display: "grid", gridTemplateColumns: "2fr 80px 60px 64px 88px 80px", padding: "10px 18px", borderBottom: i < filtered.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center", background: "#fff", textDecoration: "none" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{p.name}</div>
                <div style={{ fontSize: 10, color: "#ccc", marginTop: 1 }}>{p.slug}</div>
              </div>
              <div>
                {p.planName
                  ? <span style={{ padding: "2px 7px", borderRadius: 3, background: pc.bg, color: pc.color, fontSize: 10, fontWeight: 500 }}>{p.planName}</span>
                  : <span style={{ fontSize: 11, color: "#ccc" }}>—</span>}
              </div>
              <span style={{ fontSize: 12, color: "#666" }}>{p.domainCount}</span>
              <span style={{ fontSize: 12, color: "#666" }}>{p.memberCount}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#111" }}>{mrr}</span>
              <div>
                {p.subStatus
                  ? <span style={{ padding: "2px 7px", borderRadius: 3, background: ss.bg, color: ss.color, fontSize: 10, fontWeight: 500 }}>{p.subStatus}</span>
                  : <span style={{ fontSize: 11, color: "#ccc" }}>—</span>}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
