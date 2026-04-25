const DOMAINS = [
  { domain: "financeinsider.co",    publisher: "FinMedia Group",      plan: "Growth",  status: "ok",       lastPing: "<1s",  latency: "28ms",  gateCalls: "12,400", errors: 0,   sdkVersion: "2.4.1" },
  { domain: "marketstoday.in",      publisher: "FinMedia Group",      plan: "Growth",  status: "ok",       lastPing: "3s",   latency: "34ms",  gateCalls: "8,100",  errors: 0,   sdkVersion: "2.4.1" },
  { domain: "indiaink.com",         publisher: "IndiaInk Media",      plan: "Scale",   status: "ok",       lastPing: "<1s",  latency: "21ms",  gateCalls: "31,200", errors: 0,   sdkVersion: "2.4.1" },
  { domain: "deepvalue-india.com",  publisher: "FinMedia Group",      plan: "Growth",  status: "degraded", lastPing: "22s",  latency: "480ms", gateCalls: "4,200",  errors: 14,  sdkVersion: "2.3.0" },
  { domain: "techweekly.in",        publisher: "TechWeekly",          plan: "Starter", status: "ok",       lastPing: "2s",   latency: "55ms",  gateCalls: "3,100",  errors: 0,   sdkVersion: "2.4.1" },
  { domain: "sciencedive.com",      publisher: "DeepDive Science",    plan: "Starter", status: "ok",       lastPing: "8s",   latency: "62ms",  gateCalls: "1,800",  errors: 0,   sdkVersion: "2.4.0" },
  { domain: "courier.co.in",        publisher: "The Courier",         plan: "Growth",  status: "ok",       lastPing: "<1s",  latency: "31ms",  gateCalls: "9,800",  errors: 0,   sdkVersion: "2.4.1" },
  { domain: "equitybrief.io",       publisher: "FinMedia Group",      plan: "Growth",  status: "paused",   lastPing: "4h",   latency: "—",     gateCalls: "0",      errors: 0,   sdkVersion: "2.3.0" },
  { domain: "localpress.co",        publisher: "Local Press Network", plan: "Lite",    status: "ok",       lastPing: "12s",  latency: "44ms",  gateCalls: "980",    errors: 0,   sdkVersion: "2.4.1" },
  { domain: "presshub.in",          publisher: "PressHub",            plan: "Lite",    status: "ok",       lastPing: "6s",   latency: "38ms",  gateCalls: "520",    errors: 0,   sdkVersion: "2.4.1" },
  { domain: "divewire.com",         publisher: "DiveWire",            plan: "Starter", status: "ok",       lastPing: "4s",   latency: "47ms",  gateCalls: "2,400",  errors: 0,   sdkVersion: "2.4.0" },
]

const PLATFORM = [
  { name: "Embed API",         status: "ok",       latency: "18ms",  uptime: "99.98%" },
  { name: "Signal ingest",     status: "ok",       latency: "9ms",   uptime: "99.99%" },
  { name: "Gate evaluation",   status: "ok",       latency: "12ms",  uptime: "99.97%" },
  { name: "Analytics rollups", status: "degraded", latency: "—",     uptime: "98.2%"  },
  { name: "Razorpay webhooks", status: "ok",       latency: "—",     uptime: "100%"   },
  { name: "R2 ad delivery",    status: "ok",       latency: "24ms",  uptime: "100%"   },
]

const statusDot: Record<string, { color: string; label: string }> = {
  ok:       { color: "#27adb0", label: "OK"      },
  degraded: { color: "#c4820a", label: "Degraded"},
  paused:   { color: "#ccc",    label: "Paused"  },
  down:     { color: "#c0392b", label: "Down"    },
}

export default function HealthPage() {
  const okCount      = DOMAINS.filter(d => d.status === "ok").length
  const degraded     = DOMAINS.filter(d => d.status === "degraded").length
  const paused       = DOMAINS.filter(d => d.status === "paused").length
  const totalCalls   = "74,500"

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Health</h1>
        <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Platform and domain connection monitoring · last updated &lt;5s ago</p>
      </div>

      {/* Stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        {[
          { label: "Domains tracked", value: String(DOMAINS.length), sub: "across all publishers"   },
          { label: "Healthy",         value: String(okCount),        sub: "responding normally"     },
          { label: "Degraded",        value: String(degraded),       sub: "high latency / errors", warn: degraded > 0 },
          { label: "Gate calls today",value: totalCalls,             sub: "embed API requests"      },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: "15px 20px", borderRight: i < 3 ? "1px solid #ebebeb" : "none", background: "#fff" }}>
            <div style={{ fontSize: 11, color: "#aaa", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: s.warn ? "#c4820a" : "#111", letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#ccc", marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}>

        {/* Domain table */}
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Domain connections</span>
            <span style={{ fontSize: 11, color: "#aaa" }}>{DOMAINS.length} domains</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 70px 70px 80px 70px 60px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
            {["Domain", "Publisher", "Latency", "Calls/day", "Last ping", "SDK", "Status"].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>
          {DOMAINS.map((d, i) => {
            const sd = statusDot[d.status] ?? statusDot.ok
            return (
              <div key={d.domain} className="row-hover transition-colors duration-[80ms]"
                style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 70px 70px 80px 70px 60px", padding: "10px 18px", borderBottom: i < DOMAINS.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center", background: "#fff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: sd.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{d.domain}</span>
                </div>
                <span style={{ fontSize: 11, color: "#888" }}>{d.publisher}</span>
                <span style={{ fontSize: 12, color: d.status === "degraded" ? "#c4820a" : "#666", fontWeight: d.status === "degraded" ? 500 : 400 }}>{d.latency}</span>
                <span style={{ fontSize: 12, color: "#666" }}>{d.gateCalls}</span>
                <span style={{ fontSize: 12, color: "#ccc" }}>{d.lastPing}</span>
                <span style={{ fontSize: 11, color: "#aaa", fontFamily: "monospace" }}>{d.sdkVersion}</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: sd.color }}>{sd.label}</span>
              </div>
            )
          })}
        </div>

        {/* Platform services */}
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", alignSelf: "start" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #ebebeb" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Platform services</span>
          </div>
          {PLATFORM.map((svc, i) => {
            const sd = statusDot[svc.status] ?? statusDot.ok
            return (
              <div key={svc.name} style={{ padding: "11px 16px", borderBottom: i < PLATFORM.length - 1 ? "1px solid #f5f5f5" : "none", display: "flex", alignItems: "center", gap: 10, background: "#fff" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: sd.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{svc.name}</div>
                  <div style={{ fontSize: 11, color: "#ccc", marginTop: 1 }}>uptime {svc.uptime}{svc.latency !== "—" ? ` · ${svc.latency}` : ""}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: sd.color }}>{sd.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
