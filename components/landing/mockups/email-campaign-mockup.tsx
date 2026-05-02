export function EmailCampaignMockup() {
  const SEGMENTS = [
    { label: "new", count: "12.4K", active: false },
    { label: "casual", count: "8.1K", active: false },
    { label: "regular", count: "5.2K", active: false },
    { label: "power_user", count: "4,218", active: true },
  ]

  const STATS = [
    { label: "Open rate", value: "34.2%", color: "#27adb0" },
    { label: "Click rate", value: "8.7%", color: "#22c55e" },
    { label: "Unsubscribes", value: "0.3%", color: "#888" },
  ]

  return (
    <div style={{
      width: 560,
      background: "#fff",
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      {/* Browser chrome */}
      <div style={{ background: "#f5f5f5", borderBottom: "1px solid #e8e8e8", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#ff5f57","#febc2e","#28c840"].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{ flex: 1, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 6, height: 22, display: "flex", alignItems: "center", paddingLeft: 10, gap: 6 }}>
          <span style={{ fontSize: 10, color: "#999" }}>app.onepaywall.com / email / new-campaign</span>
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>New Campaign</span>
        <span style={{ fontSize: 12, color: "#888" }}>Send to: Power users (4,218 readers)</span>
      </div>

      {/* Segment selector */}
      <div style={{ padding: "14px 22px", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", marginBottom: 10 }}>
          Target Segment
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SEGMENTS.map(seg => (
            <div
              key={seg.label}
              style={{
                padding: "6px 12px",
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 600,
                border: seg.active ? "1px solid rgba(39,173,176,0.4)" : "1px solid #ebebeb",
                background: seg.active ? "rgba(39,173,176,0.08)" : "#fff",
                color: seg.active ? "#27adb0" : "#888",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {seg.label}
              <span style={{ fontSize: 10, opacity: 0.8 }}>{seg.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Email preview */}
      <div style={{ padding: "14px 22px", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", marginBottom: 10 }}>
          Email Preview
        </div>
        <div style={{ background: "#fafafa", border: "1px solid #ebebeb", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(39,173,176,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#27adb0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#111" }}>OnePaywall via thecourier.in</div>
              <div style={{ fontSize: 10, color: "#888" }}>hello@thecourier.in</div>
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 6 }}>
            Your exclusive access is waiting
          </div>
          <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>
            You&apos;ve read 23 articles this month. As one of our most engaged readers, we&apos;d like to offer you...
          </div>
        </div>
      </div>

      {/* Stats row + schedule button */}
      <div style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 0 }}>
        <div style={{ display: "flex", flex: 1, gap: 0 }}>
          {STATS.map((stat, i) => (
            <div key={stat.label} style={{ flex: 1, borderRight: i < STATS.length - 1 ? "1px solid #f0f0f0" : "none", paddingRight: i < STATS.length - 1 ? 16 : 0, paddingLeft: i > 0 ? 16 : 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: stat.color, letterSpacing: "-0.03em" }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{stat.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginLeft: 16 }}>
          <div style={{ background: "#27adb0", color: "#fff", borderRadius: 8, padding: "9px 18px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Schedule
          </div>
        </div>
      </div>
    </div>
  )
}
