import Link from "next/link"
import { ArrowLeft } from "lucide-react"

// Dummy detail — in production this would be fetched by ID
const PUBLISHER = {
  id: "1",
  name: "FinMedia Group",
  slug: "finmedia",
  plan: "Growth",
  status: "active",
  mrr: "₹7,999",
  mau: "84,200",
  joined: "12 Apr 2026",
  owner: "Rohit Sharma",
  ownerEmail: "rohit@finmedia.com",
  domains: [
    { domain: "financeinsider.co",    gates: 4, mau: "42,100", health: "ok",       lastSeen: "<1s" },
    { domain: "marketstoday.in",      gates: 2, mau: "18,400", health: "ok",       lastSeen: "3s"  },
    { domain: "deepvalue-india.com",  gates: 3, mau: "14,200", health: "degraded", lastSeen: "22s" },
    { domain: "fintechpulse.co",      gates: 1, mau: "6,800",  health: "ok",       lastSeen: "1s"  },
    { domain: "equitybrief.io",       gates: 2, mau: "2,700",  health: "paused",   lastSeen: "4h"  },
  ],
  members: [
    { name: "Rohit Sharma",  email: "rohit@finmedia.com",  role: "owner",  joined: "12 Apr 2026" },
    { name: "Priya Menon",   email: "priya@finmedia.com",  role: "admin",  joined: "14 Apr 2026" },
    { name: "Ankit Verma",   email: "ankit@finmedia.com",  role: "member", joined: "20 Apr 2026" },
    { name: "Sara Joshi",    email: "sara@finmedia.com",   role: "member", joined: "22 Apr 2026" },
  ],
}

const healthDot: Record<string, { color: string; label: string }> = {
  ok:       { color: "#27adb0", label: "OK"     },
  degraded: { color: "#c4820a", label: "Slow"   },
  paused:   { color: "#ccc",    label: "Paused" },
}
const roleStyle: Record<string, { bg: string; color: string }> = {
  owner:  { bg: "#faf5ff", color: "#6b21a8" },
  admin:  { bg: "#eff3ff", color: "#3451b2" },
  member: { bg: "#f5f5f5", color: "#666"    },
}

export default function PublisherDetailPage() {
  const p = PUBLISHER
  return (
    <div style={{ padding: "28px 32px" }}>
      {/* Back + header */}
      <div style={{ marginBottom: 22 }}>
        <Link href="/admin/publishers" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#aaa", textDecoration: "none", marginBottom: 12 }}>
          <ArrowLeft size={12} /> Back to publishers
        </Link>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>{p.name}</h1>
            <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{p.slug} · joined {p.joined}</p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e5e5", background: "#fff", fontSize: 12, fontWeight: 500, color: "#555", cursor: "pointer", fontFamily: "inherit" }}>
              Change plan
            </button>
            <button style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "#111", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Add member
            </button>
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        {[
          { label: "Plan",     value: p.plan,    sub: "current subscription" },
          { label: "MRR",      value: p.mrr,     sub: "platform billing"     },
          { label: "MAU",      value: p.mau,     sub: "monthly active users" },
          { label: "Domains",  value: String(p.domains.length), sub: `${p.domains.filter(d => d.health === "ok").length} healthy` },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: "15px 20px", borderRight: i < 3 ? "1px solid #ebebeb" : "none", background: "#fff" }}>
            <div style={{ fontSize: 11, color: "#aaa", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#ccc", marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14 }}>

        {/* Domains table */}
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Domains</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 50px 72px 80px 64px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
            {["Domain", "Gates", "MAU", "Last ping", "Health"].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>
          {p.domains.map((d, i) => {
            const hd = healthDot[d.health] ?? healthDot.ok
            return (
              <div key={d.domain} className="row-hover transition-colors duration-[80ms]"
                style={{ display: "grid", gridTemplateColumns: "2fr 50px 72px 80px 64px", padding: "10px 18px", borderBottom: i < p.domains.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center", background: "#fff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: hd.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{d.domain}</span>
                </div>
                <span style={{ fontSize: 12, color: "#666" }}>{d.gates}</span>
                <span style={{ fontSize: 12, color: "#666" }}>{d.mau}</span>
                <span style={{ fontSize: 12, color: "#ccc" }}>{d.lastSeen}</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: hd.color }}>{hd.label}</span>
              </div>
            )
          })}
        </div>

        {/* Members panel */}
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Team members</span>
            <button style={{ fontSize: 12, color: "#27adb0", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>+ Add</button>
          </div>
          {p.members.map((m, i) => {
            const rs = roleStyle[m.role] ?? roleStyle.member
            return (
              <div key={m.email} className="row-hover transition-colors duration-[80ms]"
                style={{ padding: "10px 16px", borderBottom: i < p.members.length - 1 ? "1px solid #f5f5f5" : "none", display: "flex", alignItems: "center", gap: 10, background: "#fff" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#888" }}>{m.name[0]}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: "#ccc" }}>{m.email}</div>
                </div>
                <span style={{ padding: "2px 6px", borderRadius: 3, background: rs.bg, color: rs.color, fontSize: 10, fontWeight: 500, flexShrink: 0 }}>{m.role}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
