// Content analytics dashboard mockup — dummy data

const ARTICLES = [
  { title: "The Fed Signals Another Hold", views: "18,420", depth: 82, gate: "Paywall", conv: "6.2%", convColor: "#22c55e" },
  { title: "Inside the AI Chip Race", views: "12,310", depth: 71, gate: "Ad gate", conv: "3.8%", convColor: "#c4820a" },
  { title: "Startup Funding Rebounds in Q2", views: "9,840", depth: 65, gate: "Paywall", conv: "4.1%", convColor: "#22c55e" },
  { title: "Climate Deal: What's in It", views: "7,620", depth: 58, gate: "Lead capture", conv: "8.4%", convColor: "#6366f1" },
]

const SOURCES = [
  { label: "Organic search", pct: 48, color: "#27adb0" },
  { label: "Social", pct: 28, color: "#6366f1" },
  { label: "Direct", pct: 15, color: "#22c55e" },
  { label: "Referral", pct: 9, color: "#c4820a" },
]

const FUNNEL = [
  { label: "Pageviews", value: 48200, color: "#27adb0", pct: 100 },
  { label: "Gate shown", value: 31400, color: "#6366f1", pct: 65 },
  { label: "Converted", value: 1982, color: "#22c55e", pct: 6.3 },
]

export function ContentAnalyticsMockup() {
  return (
    <div
      style={{
        width: 600,
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: "var(--font-sans), -apple-system, sans-serif",
        boxShadow: "0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px var(--color-border, #ebebeb)",
        background: "#fff",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Content Analytics</div>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>Top articles by engagement + source attribution</div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["7d", "30d", "90d"].map((r, i) => (
            <div key={r} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, fontWeight: i === 1 ? 600 : 400, color: i === 1 ? "#111" : "#999", background: i === 1 ? "#f0f0f0" : "transparent", border: "1px solid", borderColor: i === 1 ? "#ddd" : "transparent" }}>
              {r}
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "1px solid #ebebeb" }}>
        {[
          { label: "Engaged sessions", value: "48,200" },
          { label: "Avg read depth", value: "68%" },
          { label: "Gate conversion", value: "4.1%" },
          { label: "Time on page", value: "3m 42s" },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: "12px 14px", borderRight: i < 3 ? "1px solid #ebebeb" : "none" }}>
            <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#111", marginTop: 3, letterSpacing: "-0.02em" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Top content table */}
      <div style={{ borderBottom: "1px solid #ebebeb" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 56px 48px 68px 52px", padding: "7px 14px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
          {["Article", "Views", "Depth", "Gate", "Conv."].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</div>
          ))}
        </div>
        {ARTICLES.map((a, i) => (
          <div key={a.title} style={{ display: "grid", gridTemplateColumns: "1fr 56px 48px 68px 52px", padding: "9px 14px", borderBottom: i < ARTICLES.length - 1 ? "1px solid #f5f5f5" : "none", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{a.title}</div>
            <div style={{ fontSize: 11, color: "#555", fontVariantNumeric: "tabular-nums" }}>{a.views}</div>
            <div>
              <div style={{ height: 3, background: "#f0f0f0", borderRadius: 2, marginBottom: 3 }}>
                <div style={{ width: `${a.depth}%`, height: "100%", background: "#27adb0", borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 10, color: "#888" }}>{a.depth}%</div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#555", background: "#f5f5f5", border: "1px solid #ebebeb", borderRadius: 4, padding: "2px 6px", width: "fit-content" }}>{a.gate}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: a.convColor }}>{a.conv}</div>
          </div>
        ))}
      </div>

      {/* Source attribution + funnel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        {/* Source attribution */}
        <div style={{ padding: "14px 16px", borderRight: "1px solid #ebebeb" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Traffic sources</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {SOURCES.map(s => (
              <div key={s.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <div style={{ fontSize: 11, color: "#333" }}>{s.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.pct}%</div>
                </div>
                <div style={{ height: 3, background: "#f0f0f0", borderRadius: 2 }}>
                  <div style={{ width: `${s.pct}%`, height: "100%", background: s.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion funnel */}
        <div style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Conversion funnel</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {FUNNEL.map((f, i) => (
              <div key={f.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <div style={{ fontSize: 11, color: "#333" }}>{f.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#111" }}>{f.value.toLocaleString()}</div>
                </div>
                <div style={{ height: 5, background: "#f0f0f0", borderRadius: 3 }}>
                  <div style={{ width: `${f.pct}%`, height: "100%", background: f.color, borderRadius: 3, opacity: 0.85 }} />
                </div>
                {i < FUNNEL.length - 1 && (
                  <div style={{ fontSize: 10, color: "#aaa", marginTop: 2, textAlign: "right" }}>
                    {i === 0 ? "65% reach gate" : "6.3% convert"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
