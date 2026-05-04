import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getPublisherDetail } from "@/lib/db/queries/admin"
import { fmtINR, relativeTime } from "@/lib/format"

const planColorMap: Record<string, { bg: string; color: string }> = {
  trial:   { bg: "#f5f5f5", color: "#888"    },
  lite:    { bg: "#f5f5f5", color: "#666"    },
  starter: { bg: "#eff3ff", color: "#3451b2" },
  growth:  { bg: "#f0fdf8", color: "#166534" },
  scale:   { bg: "#faf5ff", color: "#6b21a8" },
}

const roleStyle: Record<string, { bg: string; color: string }> = {
  owner:  { bg: "#faf5ff", color: "#6b21a8" },
  admin:  { bg: "#eff3ff", color: "#3451b2" },
  member: { bg: "#f5f5f5", color: "#666"    },
}

const healthDot: Record<string, { color: string; label: string }> = {
  active:  { color: "#27adb0", label: "OK"     },
  paused:  { color: "#ccc",    label: "Paused" },
  removed: { color: "#e5e5e5", label: "Removed"},
}

export default async function PublisherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const p = await getPublisherDetail(id)
  if (!p) notFound()

  const pc = planColorMap[p.planSlug ?? ""] ?? planColorMap.lite

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
            <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
              {p.slug} · joined {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
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
          { label: "Plan",    value: p.planName ?? "—",              sub: "current subscription" },
          { label: "MRR",     value: fmtINR(p.priceMonthly),         sub: "platform billing"     },
          { label: "MAU",     value: "—",                             sub: "monthly active users" },
          { label: "Domains", value: String(p.domains.length),        sub: `${p.domains.filter(d => d.status === "active").length} active` },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: "15px 20px", borderRight: i < 3 ? "1px solid #ebebeb" : "none", background: "#fff" }}>
            <div style={{ fontSize: 11, color: "#aaa", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>{s.label}</div>
            {s.label === "Plan" && p.planSlug
              ? <span style={{ padding: "3px 8px", borderRadius: 3, background: pc.bg, color: pc.color, fontSize: 13, fontWeight: 600 }}>{s.value}</span>
              : <div style={{ fontSize: 20, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>{s.value}</div>}
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
          {p.domains.length === 0 && (
            <div style={{ padding: "24px 18px", textAlign: "center", color: "#bbb", fontSize: 13 }}>No domains yet.</div>
          )}
          {p.domains.length > 0 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 50px 80px 64px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
                {["Domain", "Gates", "Last ping", "Health"].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
                ))}
              </div>
              {p.domains.map((d, i) => {
                const hd = healthDot[d.status] ?? healthDot.active
                return (
                  <div key={d.id} className="row-hover transition-colors duration-[80ms]"
                    style={{ display: "grid", gridTemplateColumns: "2fr 50px 80px 64px", padding: "10px 18px", borderBottom: i < p.domains.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center", background: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: hd.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{d.domain}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#666" }}>{d.gateCount}</span>
                    <span style={{ fontSize: 12, color: "#ccc" }}>{relativeTime(d.lastPingAt)}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: hd.color }}>{hd.label}</span>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Members panel */}
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Team members</span>
            <button style={{ fontSize: 12, color: "#27adb0", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>+ Add</button>
          </div>
          {p.members.length === 0 && (
            <div style={{ padding: "16px", fontSize: 12, color: "#bbb" }}>No members.</div>
          )}
          {p.members.map((m, i) => {
            const rs = roleStyle[m.role] ?? roleStyle.member
            return (
              <div key={m.userId} className="row-hover transition-colors duration-[80ms]"
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
