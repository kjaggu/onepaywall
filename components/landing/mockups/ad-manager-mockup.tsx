// Ad unit manager mockup — dummy data

const AD_UNITS = [
  { name: "Pre-article video", type: "Video", impressions: "42,180", completion: "68%", fill: "91%", active: true },
  { name: "Sidebar display", type: "Display", impressions: "38,420", completion: "—", fill: "84%", active: true },
  { name: "Mobile pre-roll", type: "Video", impressions: "27,840", completion: "54%", fill: "88%", active: false },
]

const navIcons = [
  "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  "M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.899L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z",
  "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
]

export function AdManagerMockup() {
  return (
    <div
      style={{
        width: 640,
        height: 420,
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: "var(--font-sans), -apple-system, sans-serif",
        boxShadow: "0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px var(--color-border, #ebebeb)",
        background: "#fff",
        flexShrink: 0,
      }}
    >
      {/* Browser chrome */}
      <div style={{ background: "#1a1a1a", height: 36, display: "flex", alignItems: "center", padding: "0 14px", gap: 7, flexShrink: 0 }}>
        {["#ff5f57", "#febc2e", "#28c840"].map(c => (
          <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />
        ))}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ background: "#2c2c2c", borderRadius: 6, padding: "3px 14px", fontSize: 11, color: "#888" }}>
            app.onepaywall.com/ads
          </div>
        </div>
      </div>

      {/* App shell */}
      <div style={{ display: "flex", height: "calc(100% - 36px)", background: "#fff" }}>
        {/* Sidebar */}
        <div style={{ width: 48, background: "#fff", borderRight: "1px solid #ebebeb", display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0", gap: 4 }}>
          <div style={{ width: 28, height: 28, background: "#111", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          {navIcons.map((d, i) => (
            <div key={i} style={{ width: 34, height: 34, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: i === 2 ? "rgba(39,173,176,0.1)" : "transparent" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={i === 2 ? "#27adb0" : "#bbb"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
              <div style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>Ad Units</div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>AdSense performance across all gates</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, padding: "5px 10px" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
              Google AdSense connected
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {[
              { label: "Impressions", value: "108K", delta: "+14K" },
              { label: "Fill rate", value: "88%", delta: "+2%" },
              { label: "Completion", value: "62%", delta: "+4%" },
              { label: "Est. earnings", value: "₹21,400", delta: "+₹2,100" },
            ].map(s => (
              <div key={s.label} style={{ border: "1px solid #ebebeb", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: "#aaa", fontWeight: 500, letterSpacing: "0.02em", textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#111", marginTop: 3, letterSpacing: "-0.02em" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#22c55e", marginTop: 2 }}>{s.delta}</div>
              </div>
            ))}
          </div>

          {/* Ad units table */}
          <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", flex: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 68px 80px 60px 54px 56px", padding: "7px 12px", borderBottom: "1px solid #ebebeb", background: "#fafafa" }}>
              {["Ad Unit", "Type", "Impressions", "Comp.", "Fill", "Status"].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</div>
              ))}
            </div>
            {AD_UNITS.map((u, i) => (
              <div key={u.name} style={{ display: "grid", gridTemplateColumns: "1fr 68px 80px 60px 54px 56px", padding: "10px 12px", borderBottom: i < AD_UNITS.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#111" }}>{u.name}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: u.type === "Video" ? "#27adb0" : "#6366f1", background: u.type === "Video" ? "rgba(39,173,176,0.08)" : "rgba(99,102,241,0.08)", border: `1px solid ${u.type === "Video" ? "rgba(39,173,176,0.2)" : "rgba(99,102,241,0.2)"}`, borderRadius: 4, padding: "2px 6px", width: "fit-content" }}>{u.type}</div>
                <div style={{ fontSize: 11, color: "#555", fontVariantNumeric: "tabular-nums" }}>{u.impressions}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: u.completion === "—" ? "#bbb" : "#22c55e" }}>{u.completion}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>{u.fill}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: u.active ? "#22c55e" : "#e0e0e0" }} />
                  <span style={{ fontSize: 11, color: u.active ? "#22c55e" : "#aaa" }}>{u.active ? "Active" : "Paused"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
