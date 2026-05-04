import { getPlansWithStats } from "@/lib/db/queries/admin"
import { fmtINR } from "@/lib/format"

const planColorMap: Record<string, { bg: string; color: string }> = {
  trial:   { bg: "#f5f5f5", color: "#888"    },
  lite:    { bg: "#f5f5f5", color: "#666"    },
  starter: { bg: "#eff3ff", color: "#3451b2" },
  growth:  { bg: "#f0fdf8", color: "#166534" },
  scale:   { bg: "#faf5ff", color: "#6b21a8" },
}

function fmtUSD(cents: number | null) {
  if (cents == null) return "—"
  return `$${(cents / 100).toFixed(2).replace(/\.00$/, "")}`
}

function fmtCount(n: number | null) {
  if (n == null) return "Unlimited"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`
  return n.toLocaleString("en-IN")
}

export default async function PlansPage() {
  const planRows = await getPlansWithStats()

  const totalMRR          = planRows.reduce((s, p) => s + p.activeMRR, 0)
  const totalOverageInr   = planRows.reduce((s, p) => s + p.overageRevenueInr, 0)
  const totalOverageUsd   = planRows.reduce((s, p) => s + p.overageRevenueUsd, 0)

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Plans</h1>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
            Platform subscription tiers · MRR: {fmtINR(totalMRR)} / mo
            {totalOverageInr > 0 && <> · Overage this month: {fmtINR(totalOverageInr)}</>}
            {totalOverageUsd > 0 && <> + {fmtUSD(totalOverageUsd)}</>}
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
              {p.overageRevenueInr > 0 && (
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>+{fmtINR(p.overageRevenueInr)} overage</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Plan cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {planRows.map(p => {
          const pc = planColorMap[p.slug] ?? planColorMap.lite
          return (
            <div key={p.slug} style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>

              {/* Main row */}
              <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 80px", padding: "14px 20px", alignItems: "start", gap: 20 }}>

                {/* Name + prices */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ padding: "2px 8px", borderRadius: 3, background: pc.bg, color: pc.color, fontSize: 11, fontWeight: 600 }}>{p.name}</span>
                    {!p.active && <span style={{ fontSize: 10, color: "#ccc" }}>inactive</span>}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>
                    {p.priceMonthly ? `${fmtINR(p.priceMonthly)} / mo` : "Free"}
                  </div>
                  {p.priceMonthlyUsd && (
                    <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>
                      {fmtUSD(p.priceMonthlyUsd)} / mo
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
                    {p.commissionBps > 0 ? `${(p.commissionBps / 100).toFixed(1)}% commission` : "No commission"}
                  </div>
                  {p.byokAddonPriceInr && (
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                      BYOK: +{fmtINR(p.byokAddonPriceInr)} / +{fmtUSD(p.byokAddonPriceUsd)} /mo
                    </div>
                  )}
                </div>

                {/* Quota + overage grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Gate triggers / mo</div>
                    <div style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{fmtCount(p.maxMonthlyGateTriggers)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Subscriber seats</div>
                    <div style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{fmtCount(p.maxPayingSubscribers)}</div>
                    {p.subscriberOveragePriceInr != null && p.subscriberOveragePriceInr > 0 && (
                      <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
                        +{fmtINR(p.subscriberOveragePriceInr)}/{fmtUSD(p.subscriberOveragePriceUsd)} over quota
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Ad impressions / mo</div>
                    <div style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{fmtCount(p.maxFreeAdImpressions)} free</div>
                    {p.adOveragePricePerMilleInr != null && p.adOveragePricePerMilleInr > 0 && (
                      <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
                        +{fmtINR(p.adOveragePricePerMilleInr)}/{fmtUSD(p.adOveragePricePerMilleUsd)} per 1K
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Gates</div>
                    <div style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{fmtCount(p.maxGates)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Publisher subs</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>{p.subscriberCount}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>MRR + overage</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{fmtINR(p.activeMRR)}</div>
                    {p.overageRevenueInr > 0 && (
                      <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>+{fmtINR(p.overageRevenueInr)} overage</div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <button style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid #e5e5e5", background: "#fff", fontSize: 12, fontWeight: 500, color: "#555", cursor: "pointer", fontFamily: "inherit" }}>
                  Edit
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
