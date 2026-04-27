import { Users, Eye, MousePointer, Target } from "lucide-react"

const STATS = [
  { label: "Total readers (30d)",     value: "—" },
  { label: "Returning readers",        value: "—" },
  { label: "Avg. pages per visit",     value: "—" },
  { label: "Avg. engagement score",    value: "—" },
]

const SIGNALS = [
  { icon: Eye,          title: "Read time + scroll depth", body: "How deeply each reader engages with each page. Collected on every gate-checked view." },
  { icon: MousePointer, title: "Topic interests",          body: "Inferred from URLs the reader visits across your domains. Builds up over weeks." },
  { icon: Target,       title: "Monetisation propensity",  body: "An estimate of likelihood-to-pay per reader, used (later) to choose the gate that converts best for each segment." },
]

export default function AudiencePage() {
  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Audience</h1>
        <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
          Anonymous reader behaviour — no PII, ever. Signals build into segments over time.
        </p>
      </div>

      {/* Stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        {STATS.map((s, i) => (
          <div key={s.label} style={{ padding: "15px 20px", borderRight: i < STATS.length - 1 ? "1px solid #ebebeb" : "none", background: "#fff" }}>
            <div style={{ fontSize: 11, color: "#aaa", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Empty-state with signal explainer */}
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={16} color="#888" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Reader segments</span>
          <span style={{ fontSize: 11, color: "#aaa", marginLeft: "auto" }}>Coming soon</span>
        </div>
        <div style={{ padding: "48px 32px", textAlign: "center", maxWidth: 540, margin: "0 auto" }}>
          <Users size={36} color="#ddd" style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 14, fontWeight: 500, color: "#666", marginBottom: 6 }}>
            Building your audience picture
          </div>
          <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>
            Once your embed is live, every gated view contributes anonymous engagement signals.
            Segments and conversion-by-cohort show up here once we have at least a few weeks of traffic.
          </div>
        </div>
      </div>

      {/* What we collect */}
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>What we collect</span>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>
            All signals are tied to an anonymous fingerprint, never to PII. Raw signals are deleted after 90 days.
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
          {SIGNALS.map((s, i) => (
            <div key={s.title} style={{ padding: "16px 20px", borderRight: i < SIGNALS.length - 1 ? "1px solid #f5f5f5" : "none" }}>
              <s.icon size={14} color="#888" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: "#222", marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
