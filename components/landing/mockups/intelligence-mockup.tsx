// Gate intelligence panel mockup — dummy data

const STEPS = [
  { label: "Paywall",  color: "#27adb0", pct: 42, note: "42% unlock" },
  { label: "Ad gate",  color: "#c4820a", pct: 31, note: "31% pass" },
  { label: "Free pass",color: "#22c55e", pct: 27, note: "27% bypass" },
]

const SEGMENTS = [
  { label: "High-value",   pct: 18, readers: "4,218",  color: "#27adb0" },
  { label: "Engaged",      pct: 34, readers: "7,960",  color: "#22c55e" },
  { label: "Casual",       pct: 31, readers: "7,264",  color: "#c4820a" },
  { label: "First-timers", pct: 17, readers: "3,987",  color: "#aaa"    },
]

export function IntelligenceMockup() {
  let arc = 0
  return (
    <div
      style={{
        width: 480,
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: "var(--font-sans), -apple-system, sans-serif",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)",
        background: "#fff",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid #ebebeb" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Premium Article Lock</div>
              <div style={{ fontSize: 10, background: "#e8f5f5", color: "#27adb0", padding: "2px 7px", borderRadius: 20, fontWeight: 600 }}>Active</div>
            </div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>thecourier.in · Priority 1 · 3 steps</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </div>

      {/* Step flow */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #ebebeb" }}>
        <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Gate steps</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {STEPS.map((s, i) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#fff", background: s.color, padding: "4px 10px", borderRadius: 6 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>{s.note}</div>
              </div>
              {i < STEPS.length - 1 && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Donut + segments */}
      <div style={{ padding: "14px 18px", display: "flex", gap: 20 }}>
        {/* Donut chart */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Gate decisions</div>
          <svg width="120" height="120" viewBox="0 0 120 120">
            {STEPS.map((s) => {
              const r = 44, cx = 60, cy = 60
              const circumference = 2 * Math.PI * r
              const startAngle = arc
              const sweep = (s.pct / 100) * 360
              arc += sweep

              const rad = (a: number) => (a - 90) * (Math.PI / 180)
              const x1 = cx + r * Math.cos(rad(startAngle))
              const y1 = cy + r * Math.sin(rad(startAngle))
              const x2 = cx + r * Math.cos(rad(startAngle + sweep))
              const y2 = cy + r * Math.sin(rad(startAngle + sweep))
              const largeArc = sweep > 180 ? 1 : 0

              return (
                <path
                  key={s.label}
                  d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={s.color}
                  opacity={0.9}
                />
              )
            })}
            {/* Center hole */}
            <circle cx="60" cy="60" r="28" fill="#fff" />
            <text x="60" y="57" textAnchor="middle" style={{ fontSize: 14, fontWeight: 700, fill: "#111" }}>42%</text>
            <text x="60" y="69" textAnchor="middle" style={{ fontSize: 9, fill: "#aaa" }}>paid</text>
          </svg>
        </div>

        {/* Reader segments */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Reader segments</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SEGMENTS.map(seg => (
              <div key={seg.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#333" }}>{seg.label}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{seg.readers}</div>
                </div>
                <div style={{ height: 4, background: "#f0f0f0", borderRadius: 2 }}>
                  <div style={{ width: `${seg.pct}%`, height: "100%", background: seg.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderTop: "1px solid #ebebeb" }}>
        {[
          { label: "Avg read time",  value: "4m 12s" },
          { label: "Scroll depth",   value: "73%" },
          { label: "Return rate",    value: "38%" },
        ].map(stat => (
          <div key={stat.label} style={{ padding: "10px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{stat.value}</div>
            <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
