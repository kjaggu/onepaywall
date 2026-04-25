import { Lock, Plus } from "lucide-react"

export default function GatesPage() {
  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Gates</h1>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Configure paywall, ad, and free-pass rules for each domain.</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, background: "#111", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          <Plus size={14} />
          Create gate
        </button>
      </div>

      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px", textAlign: "center" }}>
        <Lock size={40} stroke="#ddd" style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 14, fontWeight: 500, color: "#888", marginBottom: 6 }}>No gates yet</div>
        <div style={{ fontSize: 12, color: "#bbb", maxWidth: 320, lineHeight: 1.6, marginBottom: 20 }}>
          Gates decide what each reader sees — paywall, ad, or free access. Add a domain first, then create a gate for it.
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, background: "#111", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          <Plus size={14} />
          Create gate
        </button>
      </div>
    </div>
  )
}
