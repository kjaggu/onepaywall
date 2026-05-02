import { getPlansWithStats } from "@/lib/db/queries/admin"

function fmtINR(paise: number | null) {
  if (paise == null) return "Free"
  return "₹" + (paise / 100).toLocaleString("en-IN")
}

const planColorMap: Record<string, { bg: string; color: string }> = {
  trial:   { bg: "#f5f5f5", color: "#888"    },
  lite:    { bg: "#f5f5f5", color: "#666"    },
  starter: { bg: "#eff3ff", color: "#3451b2" },
  growth:  { bg: "#f0fdf8", color: "#166534" },
  scale:   { bg: "#faf5ff", color: "#6b21a8" },
}

const planFeatures: Record<string, string[]> = {
  trial:   ["Free trial", "Basic gates", "Email support"],
  lite:    ["1 domain", "5,000 MAU / domain", "2 gates", "Basic analytics", "Email support"],
  starter: ["3 domains", "25,000 MAU / domain", "5 gates", "Full analytics", "Audience intelligence", "Priority email support", "14-day trial for new sign-ups"],
  growth:  ["10 domains", "1,00,000 MAU / domain", "20 gates", "Full analytics + audience intelligence", "Reader revenue reports", "Slack support"],
  scale:   ["Unlimited domains", "Unlimited MAU", "Unlimited gates", "White-label embed", "Dedicated CSM", "SLA + phone support"],
}

export default async function PlansPage() {
  const planRows = await getPlansWithStats()

  const totalMRR = planRows.reduce((s, p) => s + p.activeMRR, 0)

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Plans</h1>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
            Platform subscription tiers · Total MRR: {fmtINR(totalMRR)} / mo
          </p>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${planRows.length},1fr)`, border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        {planRows.map((p, i) => {
          const pc = planColorMap[p.slug] ?? planColorMap.lite
          return (
            <div key={p.slug} style={{ padding: "14px 18px", borderRight: i < planRows.length - 1 ? "1px solid #ebebeb" : "none", background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ padding: "2px 7px", borderRadius: 3, background: pc.bg, color: pc.color, fontSize: 10, fontWeight: 600 }}>{p.name}</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>{p.subscriberCount}</div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>subscribers</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#555", marginTop: 6 }}>{fmtINR(p.activeMRR)} MRR</div>
            </div>
          )
        })}
      </div>

      {/* Plan cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {planRows.map(p => {
          const pc = planColorMap[p.slug] ?? planColorMap.lite
          const features = planFeatures[p.slug] ?? []
          return (
            <div key={p.slug} style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr 1fr 120px 120px 80px", padding: "14px 20px", alignItems: "center", gap: 16 }}>

                {/* Name + price */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ padding: "2px 8px", borderRadius: 3, background: pc.bg, color: pc.color, fontSize: 11, fontWeight: 600 }}>{p.name}</span>
                    {!p.active && <span style={{ fontSize: 10, color: "#ccc" }}>inactive</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>
                    {p.priceMonthly ? `${fmtINR(p.priceMonthly)} / mo` : "Free"}
                  </div>
                </div>

                {/* Limits */}
                <div>
                  <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Domains</div>
                  <div style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{p.maxDomains ?? "Unlimited"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>MAU / domain</div>
                  <div style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>
                    {p.maxMauPerDomain != null ? p.maxMauPerDomain.toLocaleString("en-IN") : "Unlimited"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Gates</div>
                  <div style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{p.maxGates ?? "Unlimited"}</div>
                </div>

                {/* Subscribers */}
                <div>
                  <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Subscribers</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>{p.subscriberCount}</div>
                </div>

                {/* MRR */}
                <div>
                  <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>MRR</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{fmtINR(p.activeMRR)}</div>
                </div>

                {/* Actions */}
                <button style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid #e5e5e5", background: "#fff", fontSize: 12, fontWeight: 500, color: "#555", cursor: "pointer", fontFamily: "inherit" }}>
                  Edit
                </button>
              </div>

              {/* Features strip */}
              {features.length > 0 && (
                <div style={{ padding: "10px 20px", borderTop: "1px solid #f5f5f5", background: "#fafafa", display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {features.map(f => (
                    <span key={f} style={{ fontSize: 11, color: "#888", display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ color: "#27adb0" }}>✓</span> {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
