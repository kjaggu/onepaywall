import { Users } from "lucide-react"

const STATS = [
  { label: "Total readers (30d)",   value: "—" },
  { label: "Returning readers",     value: "—" },
  { label: "Avg. pages per visit",  value: "—" },
]

export default function AudiencePage() {
  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Audience</h1>
        <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Anonymous reader behaviour and engagement signals.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        {STATS.map((s, i) => (
          <div key={s.label} style={{ padding: "15px 20px", borderRight: i < STATS.length - 1 ? "1px solid #ebebeb" : "none", background: "#fff" }}>
            <div style={{ fontSize: 11, color: "#aaa", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Reader segments</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px", textAlign: "center" }}>
          <Users size={40} stroke="#ddd" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, fontWeight: 500, color: "#888", marginBottom: 6 }}>No audience data yet</div>
          <div style={{ fontSize: 12, color: "#bbb", maxWidth: 320, lineHeight: 1.6 }}>
            Reader signals are collected anonymously once your embed is live. No PII is ever stored.
          </div>
        </div>
      </div>
    </div>
  )
}
