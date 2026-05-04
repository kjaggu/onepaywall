import { getPlatformStats } from "@/lib/db/queries/admin"
import { fmtINR, relativeTime } from "@/lib/format"

function Spark({ data, color = "#27adb0", h = 22 }: { data: number[]; color?: string; h?: number }) {
  const w = 80, max = Math.max(...data), min = Math.min(...data)
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * (h - 2) - 1}`).join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

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

export default async function AdminOverviewPage() {
  const stats = await getPlatformStats()

  const totalMRR = stats.activeMRR
  const allPlans = ["trial", "lite", "starter", "growth", "scale"]
  const mrrMap = Object.fromEntries(stats.mrrByPlan.map(r => [r.planSlug, r]))

  const statsStrip = [
    {
      label: "Platform MRR",
      value: fmtINR(totalMRR),
      sub: "active subscriptions",
      spark: stats.mrrByPlan.map(r => r.priceMonthly * r.count),
    },
    {
      label: "Active publishers",
      value: String(stats.activePublishers),
      sub: `${stats.trialingPublishers} trialing`,
      spark: [stats.activePublishers],
    },
    {
      label: "Total domains",
      value: String(stats.totalDomains),
      sub: "across all orgs",
      spark: [stats.totalDomains],
    },
    {
      label: "Gate decisions/day",
      value: stats.gateDecisions24h >= 1_000_000
        ? `${(stats.gateDecisions24h / 1_000_000).toFixed(1)}M`
        : stats.gateDecisions24h >= 1_000
          ? `${(stats.gateDecisions24h / 1_000).toFixed(1)}K`
          : String(stats.gateDecisions24h),
      sub: "24h rolling",
      spark: [stats.gateDecisions24h],
    },
  ]

  return (
    <div style={{ padding: "28px 32px" }}>
      {/* Header */}
      <div className="fade-in delay-1" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Platform overview</h1>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
            {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · Updated just now
          </p>
        </div>
        <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "#aaa" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          All systems operational
        </div>
      </div>

      {/* Stat strip */}
      <div className="fade-in delay-2" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        {statsStrip.map((s, i) => (
          <div key={s.label} className="transition-colors duration-100 hover:bg-[#fafafa]"
            style={{ padding: "15px 20px", borderRight: i < 3 ? "1px solid #ebebeb" : "none", background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#aaa", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</span>
              {s.spark.length > 1 && <Spark data={s.spark} />}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
              <span style={{ fontSize: 20, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>{s.value}</span>
            </div>
            <div style={{ fontSize: 11, color: "#ccc", marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Two-col */}
      <div className="fade-in delay-3" style={{ display: "grid", gridTemplateColumns: "1fr 268px", gap: 14, alignItems: "start" }}>

        {/* Recent publishers table */}
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Recent publishers</span>
            <a href="/admin/publishers" style={{ fontSize: 12, color: "#27adb0" }}>View all →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 60px 88px 80px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
            {["Publisher", "Plan", "Domains", "MRR", "Status"].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>
          {stats.recentPublishers.length === 0 && (
            <div style={{ padding: "24px 18px", textAlign: "center", color: "#bbb", fontSize: 13 }}>No publishers yet.</div>
          )}
          {stats.recentPublishers.map((p, i) => {
            const ss = statusStyle[p.subStatus ?? ""] ?? statusStyle.active
            const pc = planColorMap[p.planSlug ?? ""] ?? planColorMap.lite
            return (
              <a key={p.id} href={`/admin/publishers/${p.id}`} style={{ textDecoration: "none" }}>
                <div className="row-hover transition-colors duration-[80ms]"
                  style={{ display: "grid", gridTemplateColumns: "2fr 80px 60px 88px 80px", padding: "10px 18px", borderBottom: i < stats.recentPublishers.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center", background: "#fff" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: "#ccc", marginTop: 1 }}>
                      joined {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <div>
                    {p.planName
                      ? <span style={{ padding: "2px 7px", borderRadius: 3, background: pc.bg, color: pc.color, fontSize: 10, fontWeight: 500 }}>{p.planName}</span>
                      : <span style={{ fontSize: 11, color: "#ccc" }}>—</span>}
                  </div>
                  <span style={{ fontSize: 12, color: "#666" }}>{p.domainCount}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#111" }}>
                    {p.priceMonthly != null ? fmtINR(p.priceMonthly) : "—"}
                  </span>
                  <div>
                    {p.subStatus
                      ? <span style={{ padding: "2px 7px", borderRadius: 3, background: ss.bg, color: ss.color, fontSize: 10, fontWeight: 500 }}>{p.subStatus}</span>
                      : <span style={{ fontSize: 11, color: "#ccc" }}>—</span>}
                  </div>
                </div>
              </a>
            )
          })}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* MRR by plan */}
          <div style={{ border: "1px solid #ebebeb", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 12 }}>MRR by plan</div>
            {allPlans.filter(slug => slug !== "trial").map(slug => {
              const row = mrrMap[slug]
              const mrr = row ? row.priceMonthly * row.count : 0
              const pct = totalMRR > 0 ? Math.round((mrr / totalMRR) * 100) : 0
              const pc = planColorMap[slug] ?? planColorMap.lite
              return (
                <div key={slug} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#555", fontWeight: 500, textTransform: "capitalize" }}>{slug}</span>
                    <span style={{ fontSize: 12, color: "#111", fontWeight: 500 }}>{fmtINR(mrr)}</span>
                  </div>
                  <div style={{ height: 3, background: "#f0f0f0", borderRadius: 99 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: pc.color, borderRadius: 99, opacity: 0.7 }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Alerts */}
          <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "11px 14px", borderBottom: "1px solid #ebebeb", fontSize: 13, fontWeight: 600, color: "#111" }}>Alerts</div>
            {stats.alerts.length === 0 && (
              <div style={{ padding: "16px 14px", fontSize: 12, color: "#bbb" }}>No alerts.</div>
            )}
            {stats.alerts.map((a, i) => {
              const isPastDue = a.status === "past_due"
              const color = isPastDue ? "#c4820a" : "#aaa"
              const msg = isPastDue
                ? `Payment past due · ${relativeTime(a.currentPeriodEnd)}`
                : `Trial ends in ${relativeTime(a.currentPeriodEnd)}`
              return (
                <div key={a.id} style={{ padding: "10px 14px", borderBottom: i < stats.alerts.length - 1 ? "1px solid #f5f5f5" : "none", display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, marginTop: 5, flexShrink: 0 }} />
                  <div className="flex-1">
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#333" }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 1, lineHeight: 1.4 }}>{msg}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick actions */}
          <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "11px 14px", borderBottom: "1px solid #ebebeb", fontSize: 13, fontWeight: 600, color: "#111" }}>Quick actions</div>
            {[
              { label: "View publishers",   href: "/admin/publishers" },
              { label: "Edit plan pricing",  href: "/admin/plans"      },
              { label: "View health status", href: "/admin/health"     },
            ].map((a, i, arr) => (
              <a key={a.label} href={a.href}
                className="hover:bg-[#f5f5f5] transition-colors duration-100"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: i < arr.length - 1 ? "1px solid #f5f5f5" : "none", fontSize: 12, color: "#555", textDecoration: "none" }}>
                {a.label}
                <span style={{ color: "#ccc" }}>→</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
