// Revenue ledger mockup — dummy data

const TRANSACTIONS = [
  { date: "29 Apr 2025", time: "11:42 AM", type: "subscription", badge: { bg: "#eff6ff", color: "#3b82f6", label: "Subscription" }, amount: "₹999", status: "Completed", domain: "thecourier.in" },
  { date: "29 Apr 2025", time: "10:18 AM", type: "unlock",       badge: { bg: "#f0fdf4", color: "#22c55e", label: "Article unlock" }, amount: "₹49",  status: "Completed", domain: "divewire.com" },
  { date: "28 Apr 2025", time: "8:55 PM",  type: "subscription", badge: { bg: "#eff6ff", color: "#3b82f6", label: "Subscription" }, amount: "₹999", status: "Completed", domain: "presshub.co" },
  { date: "28 Apr 2025", time: "6:02 PM",  type: "unlock",       badge: { bg: "#f0fdf4", color: "#22c55e", label: "Article unlock" }, amount: "₹49",  status: "Pending",   domain: "thecourier.in" },
  { date: "27 Apr 2025", time: "2:34 PM",  type: "subscription", badge: { bg: "#eff6ff", color: "#3b82f6", label: "Subscription" }, amount: "₹999", status: "Completed", domain: "divewire.com" },
]

const statusColor: Record<string, string> = {
  Completed: "#22c55e",
  Pending:   "#f59e0b",
  Failed:    "#ef4444",
}

export function RevenueMockup() {
  return (
    <div
      style={{
        width: 540,
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: "var(--font-sans), -apple-system, sans-serif",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)",
        background: "#fff",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>Revenue</div>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>All transactions across your domains</div>
        </div>
        <div style={{ fontSize: 11, color: "#27adb0", fontWeight: 600, padding: "5px 12px", border: "1px solid #27adb0", borderRadius: 7, cursor: "pointer" }}>
          Export CSV
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderBottom: "1px solid #ebebeb" }}>
        {[
          { label: "Total revenue",  value: "₹84,200", delta: "+₹3,100 this week" },
          { label: "Subscriptions",  value: "247",      delta: "+12 this week" },
          { label: "Article unlocks",value: "1,823",    delta: "+84 this week" },
        ].map(s => (
          <div key={s.label} style={{ padding: "12px 16px", borderRight: "1px solid #ebebeb" }}>
            <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111", marginTop: 3, letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#22c55e", marginTop: 2 }}>{s.delta}</div>
          </div>
        ))}
      </div>

      {/* Table header */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 70px 68px 100px", padding: "7px 16px", borderBottom: "1px solid #ebebeb", background: "#fafafa" }}>
        {["Date","Type","Amount","Status","Domain"].map(h => (
          <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      {TRANSACTIONS.map((t, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 90px 70px 68px 100px",
            padding: "9px 16px",
            borderBottom: i < TRANSACTIONS.length - 1 ? "1px solid #f5f5f5" : "none",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#111" }}>{t.date}</div>
            <div style={{ fontSize: 10, color: "#bbb", marginTop: 1 }}>{t.time}</div>
          </div>
          <div>
            <span style={{ fontSize: 10, background: t.badge.bg, color: t.badge.color, padding: "2px 7px", borderRadius: 20, fontWeight: 600 }}>
              {t.badge.label}
            </span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{t.amount}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: statusColor[t.status] ?? "#888" }}>{t.status}</div>
          <div style={{ fontSize: 11, color: "#888" }}>{t.domain}</div>
        </div>
      ))}
    </div>
  )
}
