// Pixel-faithful replica of the analytics dashboard — dummy data only

const IMP_Y = [62,58,55,60,46,43,40,36,42,48,33,28,26,30,23,28,33,26,20,23,28,26,18,20,16,20,23,18,16,13]
const PASS_Y = [71,69,66,71,63,61,59,56,61,66,51,46,43,49,41,46,51,46,39,41,46,43,36,39,33,36,39,34,31,29]

function chartPath(ys: number[], close = false) {
  const w = 360, pts = ys.length
  const coords = ys.map((y, i) => `${((i / (pts - 1)) * w).toFixed(1)},${y}`)
  const path = `M ${coords.join(" L ")}`
  return close ? `${path} L ${w},80 L 0,80 Z` : path
}

const domains = [
  { name: "The Courier",  sub: "thecourier.in",   conv: 6.2, readers: "12,430", rev: "₹31,200", w: 74 },
  { name: "DiveWire",     sub: "divewire.com",     conv: 3.8, readers:  "8,720", rev: "₹22,800", w: 55 },
  { name: "PressHub",     sub: "presshub.co",      conv: 2.1, readers:  "7,280", rev: "₹30,200", w: 38 },
]

const navIcons = ["M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"]

export function AnalyticsMockup() {
  return (
    <div
      style={{
        width: 640,
        height: 430,
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: "var(--font-sans), -apple-system, sans-serif",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
        background: "#fff",
        flexShrink: 0,
      }}
    >
      {/* Browser chrome */}
      <div style={{ background: "#1a1a1a", height: 36, display: "flex", alignItems: "center", padding: "0 14px", gap: 7, flexShrink: 0 }}>
        {["#ff5f57","#febc2e","#28c840"].map(c => (
          <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />
        ))}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ background: "#2c2c2c", borderRadius: 6, padding: "3px 14px", fontSize: 11, color: "#888", letterSpacing: 0 }}>
            app.onepaywall.com/analytics
          </div>
        </div>
      </div>

      {/* App shell */}
      <div style={{ display: "flex", height: "calc(100% - 36px)", background: "#fff" }}>
        {/* Sidebar */}
        <div style={{ width: 48, background: "#fff", borderRight: "1px solid #ebebeb", display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0", gap: 4 }}>
          {/* Logo */}
          <div style={{ width: 28, height: 28, background: "#111", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          {navIcons.map((d, i) => (
            <div key={i} style={{ width: 34, height: 34, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: i === 1 ? "rgba(39,173,176,0.1)" : "transparent" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={i === 1 ? "#27adb0" : "#bbb"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={d} />
              </svg>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "18px 20px 14px", overflow: "hidden", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>Analytics</div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>Gate performance, reader behaviour, and revenue</div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {["7d","30d","90d"].map((r, i) => (
                <div key={r} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, fontWeight: i === 1 ? 600 : 400, color: i === 1 ? "#111" : "#999", background: i === 1 ? "#f0f0f0" : "transparent", border: "1px solid", borderColor: i === 1 ? "#ddd" : "transparent" }}>
                  {r}
                </div>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {[
              { label: "Conversion rate", value: "4.1%",    delta: "+0.3%",  up: true },
              { label: "Unique readers",  value: "28,430",  delta: "+2,140", up: true },
              { label: "Impressions",     value: "692K",    delta: "+18K",   up: true },
              { label: "Revenue",         value: "₹84,200", delta: "+₹3,100",up: true },
            ].map(s => (
              <div key={s.label} style={{ border: "1px solid #ebebeb", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: "#aaa", fontWeight: 500, letterSpacing: "0.02em", textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#111", marginTop: 3, letterSpacing: "-0.02em" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#22c55e", marginTop: 2 }}>{s.delta}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{ border: "1px solid #ebebeb", borderRadius: 8, padding: "12px 14px 8px", flex: 1, minHeight: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#111" }}>Gate events — last 30 days</div>
              <div style={{ display: "flex", gap: 10 }}>
                {[{ c: "#27adb0", l: "Impressions" }, { c: "#22c55e", l: "Gate passes" }].map(lg => (
                  <div key={lg.l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#888" }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: lg.c }} />
                    {lg.l}
                  </div>
                ))}
              </div>
            </div>
            <svg viewBox="0 0 360 80" preserveAspectRatio="none" style={{ width: "100%", height: 72, display: "block" }}>
              <defs>
                <linearGradient id="impGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#27adb0" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#27adb0" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="passGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={chartPath(IMP_Y, true)} fill="url(#impGrad)" />
              <path d={chartPath(PASS_Y, true)} fill="url(#passGrad)" />
              <path d={chartPath(IMP_Y)} fill="none" stroke="#27adb0" strokeWidth="1.5" />
              <path d={chartPath(PASS_Y)} fill="none" stroke="#22c55e" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Domain table */}
          <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 70px 80px", padding: "7px 12px", borderBottom: "1px solid #ebebeb", background: "#fafafa" }}>
              {["Domain","Conv.","Readers","Revenue"].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</div>
              ))}
            </div>
            {domains.map((d, i) => (
              <div key={d.name} style={{ display: "grid", gridTemplateColumns: "1fr 52px 70px 80px", padding: "8px 12px", borderBottom: i < domains.length - 1 ? "1px solid #f3f3f3" : "none", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#111" }}>{d.name}</div>
                  <div style={{ fontSize: 10, color: "#bbb" }}>{d.sub}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#27adb0" }}>{d.conv}%</div>
                  <div style={{ height: 3, background: "#f0f0f0", borderRadius: 2, marginTop: 3 }}>
                    <div style={{ width: `${d.w}%`, height: "100%", background: "#27adb0", borderRadius: 2 }} />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#555" }}>{d.readers}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#111" }}>{d.rev}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
