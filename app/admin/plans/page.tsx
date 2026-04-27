const PLANS = [
  {
    slug: "lite",
    name: "Lite",
    price: 149900,
    priceLabel: "₹1,499 / mo",
    color: "#3451b2",
    bg: "#eff3ff",
    domains: 1,
    mauPerDomain: "5,000",
    gates: 2,
    features: ["1 domain", "5,000 MAU / domain", "2 gates", "Basic analytics", "Email support"],
    subscribers: 18,
    mrr: "₹26,982",
    active: true,
  },
  {
    slug: "starter",
    name: "Starter",
    price: 299900,
    priceLabel: "₹2,999 / mo",
    color: "#166534",
    bg: "#f0fdf8",
    domains: 3,
    mauPerDomain: "25,000",
    gates: 5,
    features: ["3 domains", "25,000 MAU / domain", "5 gates", "Full analytics", "Audience intelligence", "Priority email support", "14-day trial for new sign-ups"],
    subscribers: 14,
    mrr: "₹41,986",
    active: true,
  },
  {
    slug: "growth",
    name: "Growth",
    price: 799900,
    priceLabel: "₹7,999 / mo",
    color: "#166534",
    bg: "#f0fdf8",
    domains: 10,
    mauPerDomain: "1,00,000",
    gates: 20,
    features: ["10 domains", "1,00,000 MAU / domain", "20 gates", "Full analytics + audience intelligence", "Reader revenue reports", "Slack support"],
    subscribers: 9,
    mrr: "₹71,991",
    active: true,
  },
  {
    slug: "scale",
    name: "Scale",
    price: 1999900,
    priceLabel: "₹19,999 / mo",
    color: "#6b21a8",
    bg: "#faf5ff",
    domains: "Unlimited",
    mauPerDomain: "Unlimited",
    gates: "Unlimited",
    features: ["Unlimited domains", "Unlimited MAU", "Unlimited gates", "White-label embed", "Dedicated CSM", "SLA + phone support"],
    subscribers: 4,
    mrr: "₹79,996",
    active: true,
  },
]

export default function PlansPage() {
  const totalMRR = "₹2,20,955"

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Plans</h1>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Platform subscription tiers · Total MRR: {totalMRR}</p>
        </div>
        <button style={{ padding: "6px 12px", borderRadius: 6, background: "#111", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          + Add plan
        </button>
      </div>

      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        {PLANS.map((p, i) => (
          <div key={p.slug} style={{ padding: "14px 18px", borderRight: i < PLANS.length - 1 ? "1px solid #ebebeb" : "none", background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ padding: "2px 7px", borderRadius: 3, background: p.bg, color: p.color, fontSize: 10, fontWeight: 600 }}>{p.name}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>{p.subscribers}</div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>subscribers</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#555", marginTop: 6 }}>{p.mrr}</div>
          </div>
        ))}
      </div>

      {/* Plan cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PLANS.map(p => (
          <div key={p.slug} style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr 1fr 120px 120px 80px", padding: "14px 20px", alignItems: "center", gap: 16 }}>

              {/* Name + price */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ padding: "2px 8px", borderRadius: 3, background: p.bg, color: p.color, fontSize: 11, fontWeight: 600 }}>{p.name}</span>
                  {p.slug === "trial" && <span style={{ fontSize: 10, color: "#aaa" }}>no card</span>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{p.priceLabel}</div>
              </div>

              {/* Limits */}
              <div>
                <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Domains</div>
                <div style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{p.domains}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>MAU / domain</div>
                <div style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{p.mauPerDomain}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Gates</div>
                <div style={{ fontSize: 13, color: "#333", fontWeight: 500 }}>{p.gates}</div>
              </div>

              {/* Subscribers */}
              <div>
                <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>Subscribers</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>{p.subscribers}</div>
              </div>

              {/* MRR */}
              <div>
                <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>MRR</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{p.mrr}</div>
              </div>

              {/* Actions */}
              <button style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid #e5e5e5", background: "#fff", fontSize: 12, fontWeight: 500, color: "#555", cursor: "pointer", fontFamily: "inherit" }}>
                Edit
              </button>
            </div>

            {/* Features strip */}
            <div style={{ padding: "10px 20px", borderTop: "1px solid #f5f5f5", background: "#fafafa", display: "flex", gap: 16, flexWrap: "wrap" }}>
              {p.features.map(f => (
                <span key={f} style={{ fontSize: 11, color: "#888", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: "#27adb0" }}>✓</span> {f}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
