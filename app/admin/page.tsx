function Spark({ data, color = "#27adb0", h = 22 }: { data: number[]; color?: string; h?: number }) {
  const w = 80, max = Math.max(...data), min = Math.min(...data)
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * (h - 2) - 1}`).join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

const STATS = [
  { label: "Platform MRR",       value: "₹14,23,201", delta: "+22.1%", up: true,  spark: [800,950,1100,1050,1200,1350,1280,1400,1550,1600,1720,1820], sub: "vs last month" },
  { label: "Active publishers",  value: "47",          delta: "+5",     up: true,  spark: [28,30,31,33,35,36,37,39,40,42,45,47],                       sub: "3 trialing"    },
  { label: "Total domains",      value: "183",         delta: "+12",    up: true,  spark: [110,118,124,130,138,144,150,158,164,170,177,183],            sub: "across all orgs" },
  { label: "Gate decisions/day", value: "2.4M",        delta: "+8.3%",  up: true,  spark: [1.6,1.7,1.8,1.75,1.9,2.0,2.1,2.05,2.2,2.3,2.35,2.4],     sub: "24h rolling"   },
]

const RECENT_PUBLISHERS = [
  { name: "FinMedia Group",      plan: "Growth",  domains: 9,  mrr: "₹7,999",  status: "active",   joined: "12 Apr" },
  { name: "TechWeekly",         plan: "Starter", domains: 3,  mrr: "₹2,999",  status: "active",   joined: "8 Apr"  },
  { name: "DeepDive Science",   plan: "Starter", domains: 2,  mrr: "₹2,999",  status: "trialing", joined: "24 Apr" },
  { name: "Local Press Network", plan: "Lite",   domains: 1,  mrr: "₹0",      status: "active",   joined: "1 Apr"  },
  { name: "IndiaInk Media",     plan: "Scale",   domains: 24, mrr: "₹19,999", status: "active",   joined: "3 Mar"  },
]

const ALERTS = [
  { color: "#c4820a", title: "TechWeekly",       msg: "Payment past due · 3 days",      time: "3d"  },
  { color: "#27adb0", title: "IndiaInk Media",   msg: "Upgraded Starter → Scale",       time: "2h"  },
  { color: "#ccc",    title: "DeepDive Science",  msg: "Trial ends in 6 days",           time: "now" },
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

export default function AdminOverviewPage() {
  return (
    <div style={{ padding: "28px 32px" }}>
      {/* Header */}
      <div className="fade-in delay-1" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Platform overview</h1>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Fri 25 Apr 2026 · Updated just now</p>
        </div>
        <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: "#aaa" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          All systems operational
        </div>
      </div>

      {/* Stat strip */}
      <div className="fade-in delay-2" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        {STATS.map((s, i) => (
          <div key={s.label} className="transition-colors duration-100 hover:bg-[#fafafa]"
            style={{ padding: "15px 20px", borderRight: i < 3 ? "1px solid #ebebeb" : "none", background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#aaa", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</span>
              <Spark data={s.spark} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
              <span style={{ fontSize: 20, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>{s.value}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: "#27adb0", padding: "1px 5px", borderRadius: 3, background: "#27adb018" }}>{s.delta}</span>
            </div>
            <div style={{ fontSize: 11, color: "#ccc", marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Two-col */}
      <div className="fade-in delay-3" style={{ display: "grid", gridTemplateColumns: "1fr 268px", gap: 14, alignItems: "start" }}>

        {/* Publisher table */}
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
          {RECENT_PUBLISHERS.map((p, i) => {
            const ss = statusStyle[p.status] ?? statusStyle.active
            const ps = planStyle[p.plan] ?? planStyle.Lite
            return (
              <div key={p.name} className="row-hover transition-colors duration-[80ms]"
                style={{ display: "grid", gridTemplateColumns: "2fr 80px 60px 88px 80px", padding: "10px 18px", borderBottom: i < RECENT_PUBLISHERS.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center", background: "#fff" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: "#ccc", marginTop: 1 }}>joined {p.joined}</div>
                </div>
                <div><span style={{ padding: "2px 7px", borderRadius: 3, background: ps.bg, color: ps.color, fontSize: 10, fontWeight: 500 }}>{p.plan}</span></div>
                <span style={{ fontSize: 12, color: "#666" }}>{p.domains}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#111" }}>{p.mrr}</span>
                <div><span style={{ padding: "2px 7px", borderRadius: 3, background: ss.bg, color: ss.color, fontSize: 10, fontWeight: 500 }}>{p.status}</span></div>
              </div>
            )
          })}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* MRR by plan */}
          <div style={{ border: "1px solid #ebebeb", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 12 }}>MRR by plan</div>
            {[
              { plan: "Scale",   mrr: "₹5,99,970", pct: 42, color: "#6b21a8" },
              { plan: "Growth",  mrr: "₹4,79,940", pct: 34, color: "#166534" },
              { plan: "Starter", mrr: "₹2,99,900", pct: 21, color: "#3451b2" },
              { plan: "Lite",    mrr: "₹0",         pct: 0,  color: "#ccc"    },
            ].map(r => (
              <div key={r.plan} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#555", fontWeight: 500 }}>{r.plan}</span>
                  <span style={{ fontSize: 12, color: "#111", fontWeight: 500 }}>{r.mrr}</span>
                </div>
                <div style={{ height: 3, background: "#f0f0f0", borderRadius: 99 }}>
                  <div style={{ height: "100%", width: `${r.pct}%`, background: r.color, borderRadius: 99, opacity: 0.7 }} />
                </div>
              </div>
            ))}
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
            {[
              { label: "Add a publisher",    href: "/admin/publishers" },
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
