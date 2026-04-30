"use client"

import { useEffect, useState } from "react"
import { Info, Lock, Globe } from "lucide-react"

type Domain = {
  id: string
  name: string
  domain: string
  status: "active" | "paused" | "removed"
  embedEnabled: boolean
  impressions30d: number
  conversionRate30d: number
  revenue30d: number
  currency: string
}

type HourlyPoint = { hour: number; shown: number; passed: number }

type Alert = { type: "warning" | "info" | "muted"; domain: string; message: string }

type Summary = {
  revenueThisMonth: number
  currency: string
  activeSubscribers: number
  conversionRate30d: number
  impressions30d: number
  domainsLive: number
  totalDomains: number
}

type OverviewData = {
  summary: Summary
  domains: Domain[]
  hourly: HourlyPoint[]
  alerts: Alert[]
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100)
}

function fmtK(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

const ALERT_COLORS: Record<Alert["type"], string> = {
  warning: "#c4820a",
  info:    "#27adb0",
  muted:   "#ccc",
}

const STATUS_DOT: Record<string, string> = {
  active:  "#27adb0",
  paused:  "#e5e5e5",
  removed: "#e5e5e5",
}

/* ── Hourly chart ─────────────────────────────────────────────── */
function HourlyChart({ data }: { data: HourlyPoint[] }) {
  const maxVal = Math.max(...data.map(d => d.shown), 1)
  const chartH = 64
  const barW = 8
  const gap = 3
  const totalW = data.length * (barW + gap)
  const accent = "#27adb0"
  const passedColor = "#e8d5a3"

  return (
    <div>
      <svg viewBox={`0 0 ${totalW} ${chartH + 14}`} style={{ width: "100%", height: chartH + 14 }}>
        {data.map((d, i) => {
          const x = i * (barW + gap)
          const tot = (d.shown / maxVal) * chartH
          const passH = d.shown > 0 ? (d.passed / d.shown) * tot : 0
          const shownH = tot - passH
          const lbl = i === 0 ? "12a" : i === 6 ? "6a" : i === 12 ? "12p" : i === 18 ? "6p" : i === 23 ? "11p" : ""
          return (
            <g key={i}>
              <rect x={x} y={chartH - tot} width={barW} height={shownH} fill={accent} opacity={0.65} rx={1} />
              <rect x={x} y={chartH - passH} width={barW} height={passH} fill={passedColor} />
              {lbl && (
                <text x={x + barW / 2} y={chartH + 12} fontSize={7} textAnchor="middle" fill="#ccc" fontFamily="inherit">
                  {lbl}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        {[
          { c: accent, o: 0.65, l: "Shown" },
          { c: passedColor, o: 1, l: "Passed" },
        ].map(item => (
          <div key={item.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: item.c, opacity: item.o }} />
            <span style={{ fontSize: 10, color: "#bbb" }}>{item.l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/overview")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d) })
      .catch(() => {})
  }, [])

  const s = data?.summary
  const now = new Date()
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })

  const STATS = [
    {
      label: "Revenue this month",
      value: s ? fmt(s.revenueThisMonth, s.currency) : "—",
      sub: "completed payments",
    },
    {
      label: "Active subscribers",
      value: s ? s.activeSubscribers.toLocaleString() : "—",
      sub: "current period",
    },
    {
      label: "Avg. conversion",
      value: s ? `${s.conversionRate30d}%` : "—",
      sub: "across all domains · 30d",
    },
    {
      label: "Gate health",
      value: s ? `${s.domainsLive} / ${s.totalDomains}` : "—",
      sub: "domains live",
    },
  ]

  const totalShown = data?.hourly.reduce((a, b) => a + b.shown, 0) ?? 0
  const filteredDomains = (data?.domains ?? []).filter(d =>
    d.domain.toLowerCase().includes(search.toLowerCase())
  )
  const maxImpressions = Math.max(...(data?.domains ?? []).map(d => d.impressions30d), 1)

  return (
    <div className="flex-1 overflow-y-auto bg-white" style={{ padding: "28px 32px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Overview</h1>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{dateStr} · Updated just now</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#aaa" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#27adb0" }} />
          All systems operational
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 18 }}>
        {STATS.map((st, i) => (
          <div
            key={st.label}
            style={{ padding: "15px 20px", borderRight: i < 3 ? "1px solid #ebebeb" : "none", background: "#fff" }}
          >
            <div style={{ fontSize: 11, color: "#aaa", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
              {st.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>
              {st.value}
            </div>
            <div style={{ fontSize: 11, color: "#ccc", marginTop: 3 }}>{st.sub}</div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 268px", gap: 14, alignItems: "start" }}>

        {/* Domain table */}
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid #ebebeb" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Domain health</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 9px", border: "1px solid #e5e5e5", borderRadius: 5 }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <circle cx={11} cy={11} r={8} /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter…"
                style={{ border: "none", outline: "none", fontSize: 12, color: "#333", width: 110, background: "transparent", fontFamily: "inherit" }}
              />
            </div>
          </div>

          {/* Head */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 90px 90px 110px 80px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
            {["Domain", "30d views", "Conv. rate", "30d revenue", "Status"].map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>

          {!data ? (
            [0, 1, 2].map(i => (
              <div key={i} style={{ padding: "13px 18px", borderBottom: i < 2 ? "1px solid #f5f5f5" : "none", display: "flex", gap: 20 }}>
                <div style={{ flex: 1, height: 12, background: "#f0f0f0", borderRadius: 4 }} />
                <div style={{ width: 60, height: 12, background: "#f0f0f0", borderRadius: 4 }} />
                <div style={{ width: 60, height: 12, background: "#f0f0f0", borderRadius: 4 }} />
              </div>
            ))
          ) : filteredDomains.length === 0 ? (
            <div style={{ padding: "48px 32px", textAlign: "center" }}>
              <Globe size={32} stroke="#ddd" style={{ margin: "0 auto 10px" }} />
              <div style={{ fontSize: 13, color: "#aaa" }}>No domains yet</div>
              <div style={{ fontSize: 12, color: "#ccc", marginTop: 4 }}>Add a domain to start serving gates.</div>
            </div>
          ) : (
            filteredDomains.map((d, i) => {
              const dotColor = d.status === "active" && d.embedEnabled ? "#27adb0" : STATUS_DOT[d.status] ?? "#ccc"
              const statusLabel = !d.embedEnabled ? "Not installed" : d.status === "active" ? "Active" : "Paused"
              const statusColor = !d.embedEnabled ? "#bbb" : d.status === "active" ? "#27adb0" : "#888"
              return (
                <div
                  key={d.id}
                  style={{ display: "grid", gridTemplateColumns: "2fr 90px 90px 110px 80px", padding: "10px 18px", borderBottom: i < filteredDomains.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center", background: "#fff" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.domain}</div>
                      <div style={{ fontSize: 10, color: "#ccc", marginTop: 1 }}>{d.name}</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: "#666" }}>{fmtK(d.impressions30d)}</div>
                    <div style={{ marginTop: 3, height: 3, background: "#f0f0f0", borderRadius: 99, width: 60 }}>
                      <div style={{ height: "100%", width: `${(d.impressions30d / maxImpressions) * 100}%`, background: "#27adb0", borderRadius: 99, opacity: 0.45 }} />
                    </div>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>
                    {d.impressions30d > 0 ? `${d.conversionRate30d}%` : <span style={{ color: "#ccc" }}>—</span>}
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 500, color: "#111" }}>
                    {d.revenue30d > 0 ? fmt(d.revenue30d, d.currency) : <span style={{ color: "#ccc", fontWeight: 400 }}>—</span>}
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 500, color: statusColor }}>{statusLabel}</div>
                </div>
              )
            })
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Gate decisions chart */}
          <div style={{ border: "1px solid #ebebeb", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Gate decisions</span>
              <span style={{ fontSize: 11, color: "#aaa" }}>Today</span>
            </div>
            <div style={{ fontSize: 19, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>
              {totalShown.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: "#aaa", marginBottom: 12 }}>gate views processed</div>
            {data ? <HourlyChart data={data.hourly} /> : (
              <div style={{ height: 78, background: "#fafafa", borderRadius: 4 }} />
            )}
          </div>

          {/* Alerts */}
          <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "11px 14px", borderBottom: "1px solid #ebebeb", fontSize: 13, fontWeight: 600, color: "#111" }}>Alerts</div>
            {!data ? (
              <div style={{ padding: "12px 14px" }}>
                <div style={{ height: 12, background: "#f0f0f0", borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 12, background: "#f0f0f0", borderRadius: 4, width: "70%" }} />
              </div>
            ) : data.alerts.length === 0 ? (
              <div style={{ padding: "20px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#27adb0" }} />
                <span style={{ fontSize: 12, color: "#aaa" }}>No issues detected</span>
              </div>
            ) : (
              data.alerts.map((a, i) => (
                <div key={i} style={{ padding: "10px 14px", borderBottom: i < data.alerts.length - 1 ? "1px solid #f5f5f5" : "none", display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: ALERT_COLORS[a.type], marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#333" }}>{a.domain}</div>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 1, lineHeight: 1.4 }}>{a.message}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Setup nudge — only when no domains are live */}
          {data && data.summary.domainsLive === 0 && (
            <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "11px 14px", borderBottom: "1px solid #ebebeb", fontSize: 13, fontWeight: 600, color: "#111" }}>Get started</div>
              {[
                { icon: Lock,  label: "Create a gate",  href: "/gates"   },
                { icon: Globe, label: "Add a domain",   href: "/domains" },
              ].map((item, i) => (
                <a
                  key={item.label}
                  href={item.href}
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", background: "#fff", borderBottom: i === 0 ? "1px solid #f5f5f5" : "none", fontSize: 12, color: "#555", textDecoration: "none" }}
                >
                  <item.icon size={12} stroke="#ccc" />
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 14, fontSize: 11, color: "#ddd" }}>
        <Info size={11} stroke="#ddd" />
        Analytics are 30-day rolling · Revenue reflects completed payments only
      </div>
    </div>
  )
}
