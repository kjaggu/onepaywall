"use client"

import { useState } from "react"
import { Info, Lock, Globe, BarChart2 } from "lucide-react"

/* ── Sparkline ───────────────────────────────────────────────── */
function Spark({ data, color = "#27adb0", h = 22 }: { data: number[]; color?: string; h?: number }) {
  const w = 80
  const max = Math.max(...data)
  const min = Math.min(...data)
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * (h - 2) - 1}`)
    .join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/* ── Gate Activity Chart ─────────────────────────────────────── */
function GateActivityChart() {
  const paywall = [120,95,80,60,45,40,55,130,280,380,420,460,490,510,480,440,390,360,310,270,220,190,160,140]
  const ad      = [80, 60,50,40,30,25,35,90, 180,240,260,280,300,310,295,270,240,220,190,165,135,115,100,88]
  const free    = [200,160,140,110,80,70,95,210,350,430,470,490,510,530,510,480,430,400,350,310,260,230,200,175]
  const hours   = Array.from({ length: 24 }, (_, i) => i)
  const maxVal  = Math.max(...hours.map((_, i) => paywall[i] + ad[i] + free[i]))
  const chartH  = 64, barW = 8, gap = 3
  const totalW  = hours.length * (barW + gap)
  const accent  = "#27adb0"

  return (
    <div>
      <svg viewBox={`0 0 ${totalW} ${chartH + 14}`} style={{ width: "100%", height: chartH + 14 }}>
        {hours.map((_, i) => {
          const x = i * (barW + gap)
          const tot = ((paywall[i] + ad[i] + free[i]) / maxVal) * chartH
          const pH = (paywall[i] / (paywall[i] + ad[i] + free[i])) * tot
          const aH = (ad[i] / (paywall[i] + ad[i] + free[i])) * tot
          const fH = tot - pH - aH
          const lbl = i === 0 ? "12a" : i === 6 ? "6a" : i === 12 ? "12p" : i === 18 ? "6p" : i === 23 ? "11p" : ""
          return (
            <g key={i}>
              <rect x={x} y={chartH - tot} width={barW} height={fH} fill="#f0f0f0" rx={1} />
              <rect x={x} y={chartH - tot + fH} width={barW} height={aH} fill="#e8d5a3" />
              <rect x={x} y={chartH - pH} width={barW} height={pH} fill={accent} opacity={0.75} />
              {lbl && <text x={x + barW / 2} y={chartH + 12} fontSize={7} textAnchor="middle" fill="#ccc" fontFamily="inherit">{lbl}</text>}
            </g>
          )
        })}
      </svg>
      <div className="flex gap-3 mt-2">
        {[{ c: accent, l: "Paywall" }, { c: "#e8d5a3", l: "Ad" }, { c: "#f0f0f0", l: "Free", border: true }].map((item) => (
          <div key={item.l} className="flex items-center gap-1">
            <div style={{ width: 8, height: 8, borderRadius: 2, background: item.c, border: item.border ? "1px solid #e5e5e5" : "none" }} />
            <span style={{ fontSize: 10, color: "#bbb" }}>{item.l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Data ─────────────────────────────────────────────────────── */
const STATS = [
  { label: "MRR",               value: "$125,890", delta: "+18.4%", up: true,  spark: [80,88,82,95,104,99,118,114,128,122,140,148], sub: "vs last month"      },
  { label: "Active subscribers", value: "8,721",   delta: "+11.2%", up: true,  spark: [6200,6400,6700,6600,7000,7200,7100,7600,7500,8100,8500,8721], sub: "vs last month" },
  { label: "Avg. conversion",   value: "4.3%",     delta: "+0.8pp", up: true,  spark: [3.2,3.4,3.1,3.6,3.8,3.7,4.0,4.1,3.9,4.2,4.3,4.3], sub: "across all domains" },
  { label: "Gate health",       value: "98.2%",    delta: "All OK", up: true,  spark: [99,100,98,100,99,100,100,99,98,99,100,98], sub: "5 of 5 domains live" },
]

const DOMAINS = [
  { domain: "financeinsider.co",    type: "Hard",    subs: 4102, conv: 9.2, convTrend: +1.1, rev: "$61,300", requests: "18.4k", latency: 28,  health: "ok",       lastSeen: "<1s ago" },
  { domain: "techcrunch-weekly.io", type: "Hard",    subs: 2891, conv: 7.8, convTrend: -0.2, rev: "$38,210", requests: "12.1k", latency: 31,  health: "ok",       lastSeen: "2s ago"  },
  { domain: "theguardian-us.com",   type: "Metered", subs: 2341, conv: 4.2, convTrend: +0.4, rev: "$12,440", requests: "9.8k",  latency: 44,  health: "ok",       lastSeen: "4s ago"  },
  { domain: "deepdive-sci.com",     type: "Metered", subs: 891,  conv: 5.5, convTrend: +0.6, rev: "$9,120",  requests: "3.2k",  latency: 67,  health: "degraded", lastSeen: "12s ago" },
  { domain: "localpress.news",      type: "Ad-only", subs: 496,  conv: 1.1, convTrend: -0.8, rev: "$4,820",  requests: "2.2k",  latency: 0,   health: "paused",   lastSeen: "2h ago"  },
]

const ALERTS = [
  { color: "#c4820a", title: "deepdive-sci.com",   msg: "Latency >60ms for 18 min",        time: "9m" },
  { color: "#27adb0", title: "financeinsider.co",  msg: "Conversion spike +22% vs 7d avg", time: "1h" },
  { color: "#ccc",    title: "localpress.news",    msg: "Gate paused by publisher",         time: "2h" },
]

const QUICK_ACTIONS = [
  { icon: Lock,     label: "Create a new gate"  },
  { icon: Globe,    label: "Add a domain"        },
  { icon: BarChart2, label: "View revenue report" },
]

const healthDot = (h: string) => ({
  ok:       { color: "#27adb0", label: "OK"     },
  degraded: { color: "#c4820a", label: "Slow"   },
  error:    { color: "#c0392b", label: "Error"  },
  paused:   { color: "#ccc",    label: "Paused" },
}[h] ?? { color: "#ccc", label: "—" })

const typeTag: Record<string, { bg: string; color: string }> = {
  Hard:     { bg: "#f5f5f5", color: "#444"   },
  Metered:  { bg: "#eff3ff", color: "#3451b2" },
  "Ad-only":{ bg: "#fff8ed", color: "#945d00" },
}

const maxSubs = Math.max(...DOMAINS.map((d) => d.subs))

/* ── Page ─────────────────────────────────────────────────────── */
export default function OverviewPage() {
  const [search, setSearch] = useState("")
  const filtered = DOMAINS.filter((d) => d.domain.includes(search))

  return (
    <div className="flex-1 overflow-y-auto p-7 bg-white" style={{ padding: "28px 32px" }}>

      {/* Header */}
      <div className="fade-in delay-1 flex items-center justify-between mb-[22px]">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Overview</h1>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Thu 24 Apr 2026 · Updated just now</p>
        </div>
        <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "#aaa" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          All systems operational
        </div>
      </div>

      {/* Stat strip */}
      <div
        className="fade-in delay-2 grid mb-[18px] overflow-hidden"
        style={{ gridTemplateColumns: "repeat(4,1fr)", border: "1px solid #ebebeb", borderRadius: 8 }}
      >
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className="transition-colors duration-100 hover:bg-[#fafafa]"
            style={{ padding: "15px 20px", borderRight: i < 3 ? "1px solid #ebebeb" : "none", background: "#fff" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 11, color: "#aaa", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</span>
              <Spark data={s.spark} color={s.up ? "#27adb0" : "#e8a87c"} />
            </div>
            <div className="flex items-baseline gap-[7px]">
              <span style={{ fontSize: 20, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>{s.value}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: s.up ? "#27adb0" : "#c0392b", padding: "1px 5px", borderRadius: 3, background: s.up ? "#27adb018" : "#fdecea" }}>
                {s.delta}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#ccc", marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="fade-in delay-3" style={{ display: "grid", gridTemplateColumns: "1fr 268px", gap: 14, alignItems: "start" }}>

        {/* Domain health table */}
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
          <div className="flex items-center justify-between" style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Domain health</span>
            <div className="flex items-center gap-1.5" style={{ padding: "4px 9px", border: "1px solid #e5e5e5", borderRadius: 5 }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <circle cx={11} cy={11} r={8}/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter…"
                style={{ border: "none", outline: "none", fontSize: 12, color: "#333", width: 110, background: "transparent", fontFamily: "inherit" }}
              />
            </div>
          </div>

          {/* Table head */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 76px 72px 88px 104px 80px 72px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
            {["Domain", "Gate", "24h reqs", "Conv. rate", "Subscribers", "Revenue", "Health"].map((h) => (
              <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>

          {filtered.map((d, i) => {
            const hd = healthDot(d.health)
            const tt = typeTag[d.type] ?? typeTag.Hard
            return (
              <div
                key={d.domain}
                className="row-hover transition-colors duration-[80ms]"
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 76px 72px 88px 104px 80px 72px",
                  padding: "10px 18px",
                  borderBottom: i < filtered.length - 1 ? "1px solid #f5f5f5" : "none",
                  alignItems: "center",
                  background: "#fff",
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: hd.color, flexShrink: 0 }} />
                  <div className="min-w-0">
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.domain}</div>
                    <div style={{ fontSize: 10, color: "#ccc", marginTop: 1 }}>{d.lastSeen}</div>
                  </div>
                </div>
                <div>
                  <span style={{ padding: "2px 6px", borderRadius: 3, background: tt.bg, color: tt.color, fontSize: 10, fontWeight: 500, whiteSpace: "nowrap" }}>{d.type}</span>
                </div>
                <span style={{ fontSize: 12, color: "#666" }}>{d.requests}</span>
                <div className="flex items-center gap-1">
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{d.conv}%</span>
                  <span style={{ fontSize: 10, color: d.convTrend > 0 ? "#27adb0" : d.convTrend < 0 ? "#c0392b" : "#bbb", fontWeight: 500 }}>
                    {d.convTrend > 0 ? `+${d.convTrend}` : d.convTrend}pp
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#111", marginBottom: 3 }}>{d.subs.toLocaleString()}</div>
                  <div style={{ height: 3, background: "#f0f0f0", borderRadius: 99 }}>
                    <div style={{ height: "100%", width: `${(d.subs / maxSubs) * 100}%`, background: "#27adb0", borderRadius: 99, opacity: 0.5 }} />
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#111" }}>{d.rev}</span>
                <div className="flex items-center gap-1">
                  <span style={{ fontSize: 11, fontWeight: 500, color: hd.color }}>{hd.label}</span>
                  {d.health === "ok" && <span style={{ fontSize: 10, color: "#ccc" }}>{d.latency}ms</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3">

          {/* Gate decisions */}
          <div style={{ border: "1px solid #ebebeb", borderRadius: 8, padding: "14px 16px" }}>
            <div className="flex items-baseline justify-between mb-1">
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Gate decisions</span>
              <span style={{ fontSize: 11, color: "#aaa" }}>Today</span>
            </div>
            <div style={{ fontSize: 19, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>47,320</div>
            <div style={{ fontSize: 11, color: "#aaa", marginBottom: 12 }}>requests processed</div>
            <GateActivityChart />
          </div>

          {/* Alerts */}
          <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "11px 14px", borderBottom: "1px solid #ebebeb", fontSize: 13, fontWeight: 600, color: "#111" }}>Alerts</div>
            {ALERTS.map((a, i) => (
              <div key={i} style={{ padding: "10px 14px", borderBottom: i < ALERTS.length - 1 ? "1px solid #f5f5f5" : "none", display: "flex", gap: 9, alignItems: "flex-start" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: a.color, marginTop: 5, flexShrink: 0 }} />
                <div className="flex-1">
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#333" }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: "#999", marginTop: 1, lineHeight: 1.4 }}>{a.msg}</div>
                </div>
                <span style={{ fontSize: 10, color: "#ccc", flexShrink: 0 }}>{a.time}</span>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "11px 14px", borderBottom: "1px solid #ebebeb", fontSize: 13, fontWeight: 600, color: "#111" }}>Quick actions</div>
            {QUICK_ACTIONS.map((a, i) => (
              <button
                key={a.label}
                className="hover:bg-[#f5f5f5] transition-colors duration-100"
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", background: "#fff", border: "none", borderBottom: i < QUICK_ACTIONS.length - 1 ? "1px solid #f5f5f5" : "none", fontSize: 12, color: "#555", textAlign: "left", cursor: "pointer" }}
              >
                <a.icon size={12} stroke="#ccc" />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="flex items-center gap-1 mt-3.5" style={{ fontSize: 11, color: "#ddd" }}>
        <Info size={11} stroke="#ddd" />
        Metrics delayed up to 1 hour · Health updates every 30s
      </div>
    </div>
  )
}
