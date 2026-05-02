export function GateBuilderMockup() {
  const STEPS = [
    { label: "Subscription CTA", color: "#27adb0", bg: "rgba(39,173,176,0.08)", border: "rgba(39,173,176,0.25)", stat: "32% convert" },
    { label: "Pay to Unlock", color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.25)", stat: "68% proceed" },
  ]

  const TRIGGERS = [
    { condition: "Visit count", op: "≥", value: "3", type: "visit" },
    { condition: "Segment", op: "=", value: "regular, power_user", type: "segment" },
    { condition: "URL matches", op: "", value: "/articles/**", type: "url" },
  ]

  return (
    <div style={{
      width: 640,
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
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span style={{ fontSize: 10, color: "#999" }}>app.onepaywall.com / gates / edit</span>
        </div>
      </div>

      {/* Gate header */}
      <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Premium Gate</span>
          <span style={{ fontSize: 12, color: "#888" }}>·</span>
          <span style={{ fontSize: 12, color: "#888" }}>thecourier.in</span>
        </div>
        <div style={{ fontSize: 11, background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 100, padding: "3px 10px", fontWeight: 600 }}>
          Active
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        {/* Left: step sequence */}
        <div style={{ padding: "20px 22px", borderRight: "1px solid #f0f0f0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", marginBottom: 16 }}>
            Step Sequence
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {STEPS.map((step, i) => (
              <div key={step.label}>
                <div style={{
                  background: step.bg,
                  border: `1px solid ${step.border}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: step.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>{i + 1}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>{step.label}</span>
                  </div>
                  <span style={{ fontSize: 11, color: step.color, fontWeight: 600 }}>{step.stat}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ display: "flex", alignItems: "center", padding: "4px 0 4px 28px", gap: 6 }}>
                    <div style={{ width: 1, height: 16, background: "#e0e0e0" }} />
                    <span style={{ fontSize: 10, color: "#ccc", fontWeight: 600 }}>→ on skip</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: trigger rules */}
        <div style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", marginBottom: 16 }}>
            Trigger Rules
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {TRIGGERS.map((t, i) => (
              <div key={t.condition}>
                <div style={{ background: "#fafafa", border: "1px solid #ebebeb", borderRadius: 8, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#888", minWidth: 72 }}>{t.condition}</span>
                  {t.op && <span style={{ fontSize: 11, fontWeight: 700, color: "#27adb0" }}>{t.op}</span>}
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#111", background: "#fff", border: "1px solid #e8e8e8", borderRadius: 5, padding: "2px 7px", fontFamily: "monospace" }}>
                    {t.value}
                  </span>
                </div>
                {i < TRIGGERS.length - 1 && (
                  <div style={{ paddingLeft: 12, paddingTop: 3, paddingBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#27adb0", background: "rgba(39,173,176,0.08)", border: "1px solid rgba(39,173,176,0.15)", borderRadius: 4, padding: "1px 6px" }}>AND</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer stats */}
      <div style={{ background: "#fafafa", borderTop: "1px solid #f0f0f0", padding: "12px 22px", display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#27adb0" }} />
          <span style={{ fontSize: 11, color: "#888" }}>Priority 1</span>
        </div>
        <span style={{ fontSize: 11, color: "#888" }}>2,430 triggers this week</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", marginLeft: "auto" }}>₹18,400 revenue</span>
      </div>
    </div>
  )
}
