import { getDomainsHealth, getPlatformStats } from "@/lib/db/queries/admin"
import { relativeTime } from "@/lib/format"

const statusDot: Record<string, { color: string; label: string }> = {
  ok:       { color: "#27adb0", label: "OK"      },
  degraded: { color: "#c4820a", label: "Degraded"},
  paused:   { color: "#ccc",    label: "Paused"  },
  down:     { color: "#c0392b", label: "Down"    },
}

export default async function HealthPage() {
  const [domains, stats] = await Promise.all([
    getDomainsHealth(),
    getPlatformStats(),
  ])

  const okCount      = domains.filter(d => d.healthStatus === "ok").length
  const degraded     = domains.filter(d => d.healthStatus === "degraded").length
  const down         = domains.filter(d => d.healthStatus === "down").length
  const paused       = domains.filter(d => d.healthStatus === "paused").length
  const unhealthy    = degraded + down

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Health</h1>
        <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Platform and domain connection monitoring</p>
      </div>

      {/* Stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        {[
          { label: "Domains tracked",   value: String(domains.length),          sub: "across all publishers"   },
          { label: "Healthy",           value: String(okCount),                  sub: "active, pinged < 1h"     },
          { label: "Unhealthy",         value: String(unhealthy),                sub: "degraded or no ping", warn: unhealthy > 0 },
          { label: "Gate calls today",  value: stats.gateDecisions24h.toLocaleString(), sub: "embed API requests"  },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: "15px 20px", borderRight: i < 3 ? "1px solid #ebebeb" : "none", background: "#fff" }}>
            <div style={{ fontSize: 11, color: "#aaa", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: s.warn ? "#c4820a" : "#111", letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#ccc", marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Domain table */}
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Domain connections</span>
          <span style={{ fontSize: 11, color: "#aaa" }}>{domains.length} domains · {paused} paused</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 80px 100px 80px 60px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
          {["Domain", "Publisher", "Plan", "Calls/day", "Last ping", "Status"].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>
        {domains.length === 0 && (
          <div style={{ padding: "24px 18px", fontSize: 13, color: "#aaa" }}>No domains yet.</div>
        )}
        {domains.map((d, i) => {
          const sd = statusDot[d.healthStatus] ?? statusDot.ok
          return (
            <div key={d.id}
              style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 80px 100px 80px 60px", padding: "10px 18px", borderBottom: i < domains.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center", background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: sd.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{d.domain}</span>
              </div>
              <span style={{ fontSize: 11, color: "#888" }}>{d.publisherName}</span>
              <span style={{ fontSize: 11, color: "#aaa", fontFamily: "monospace" }}>{d.planSlug ?? "—"}</span>
              <span style={{ fontSize: 12, color: "#666" }}>{d.callsToday.toLocaleString()}</span>
              <span style={{ fontSize: 12, color: d.healthStatus === "degraded" ? "#c4820a" : "#ccc" }}>{relativeTime(d.lastPingAt)}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: sd.color }}>{sd.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
