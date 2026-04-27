"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Trash2, Check, Save } from "lucide-react"

type Plan = {
  id: string
  currency: string
  monthlyPrice: number | null
  quarterlyPrice: number | null
  annualPrice: number | null
  subsEnabled: boolean
  defaultUnlockPrice: number | null
  unlockEnabled: boolean
}

type ContentPrice = {
  id: string
  urlPattern: string
  price: number
  label: string | null
}

function PriceInput({ label, value, onChange, placeholder }: {
  label: string
  value: number | null
  onChange: (v: number | null) => void
  placeholder?: string
}) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid #ddd", borderRadius: 6, overflow: "hidden" }}>
        <span style={{ padding: "7px 10px", fontSize: 13, color: "#888", borderRight: "1px solid #ddd", background: "#fafafa" }}>₹</span>
        <input
          type="number"
          min={0}
          step={1}
          placeholder={placeholder ?? "0"}
          value={value != null ? (value / 100) : ""}
          onChange={e => onChange(e.target.value === "" ? null : Math.round(parseFloat(e.target.value) * 100))}
          style={{ flex: 1, border: "none", padding: "7px 10px", fontSize: 13, outline: "none", fontFamily: "inherit" }}
        />
      </div>
    </div>
  )
}

export default function PlansPage() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [contentPrices, setContentPrices] = useState<ContentPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [newUrl, setNewUrl] = useState("")
  const [newPrice, setNewPrice] = useState<number | null>(null)
  const [newLabel, setNewLabel] = useState("")
  const [addingUrl, setAddingUrl] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/publisher-plans")
    if (res.ok) {
      const data = await res.json()
      setPlan(data.plan ?? {
        currency: "INR",
        monthlyPrice: null, quarterlyPrice: null, annualPrice: null, subsEnabled: false,
        defaultUnlockPrice: null, unlockEnabled: false,
      })
      setContentPrices(data.contentPrices ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function savePlan() {
    if (!plan) return
    setSaving(true)
    await fetch("/api/publisher-plans", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currency: plan.currency,
        monthlyPrice: plan.monthlyPrice,
        quarterlyPrice: plan.quarterlyPrice,
        annualPrice: plan.annualPrice,
        subsEnabled: plan.subsEnabled,
        defaultUnlockPrice: plan.defaultUnlockPrice,
        unlockEnabled: plan.unlockEnabled,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function addUrlPrice() {
    if (!newUrl.trim() || newPrice == null) return
    setAddingUrl(true)
    const res = await fetch("/api/publisher-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urlPattern: newUrl.trim(), price: newPrice, label: newLabel.trim() || null }),
    })
    if (res.ok) {
      setNewUrl(""); setNewPrice(null); setNewLabel("")
      load()
    }
    setAddingUrl(false)
  }

  async function removeUrlPrice(id: string) {
    await fetch(`/api/publisher-plans/prices/${id}`, { method: "DELETE" })
    setContentPrices(p => p.filter(r => r.id !== id))
  }

  if (loading) {
    return (
      <div style={{ padding: "28px 32px" }}>
        <div style={{ width: 200, height: 20, background: "#f0f0f0", borderRadius: 4, marginBottom: 8 }} />
        <div style={{ width: 300, height: 12, background: "#f5f5f5", borderRadius: 4 }} />
      </div>
    )
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 680 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111" }}>Pricing</h1>
        <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Set what readers pay you — subscriptions and per-article unlocks.</p>
      </div>

      {/* ── Subscriptions ── */}
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Subscriptions</span>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>Readers pay a recurring fee to access all your gated content.</div>
          </div>
          <button
            onClick={() => plan && setPlan(p => p ? { ...p, subsEnabled: !p.subsEnabled } : p)}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              border: `1px solid ${plan?.subsEnabled ? "#111" : "#ddd"}`,
              background: plan?.subsEnabled ? "#111" : "#fff",
              color: plan?.subsEnabled ? "#fff" : "#555",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.12s",
            }}
          >
            {plan?.subsEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        <div style={{ padding: "18px", opacity: plan?.subsEnabled ? 1 : 0.45, pointerEvents: plan?.subsEnabled ? "auto" : "none" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
            <PriceInput
              label="Monthly"
              value={plan?.monthlyPrice ?? null}
              onChange={v => plan && setPlan(p => p ? { ...p, monthlyPrice: v } : p)}
              placeholder="99"
            />
            <PriceInput
              label="Quarterly"
              value={plan?.quarterlyPrice ?? null}
              onChange={v => plan && setPlan(p => p ? { ...p, quarterlyPrice: v } : p)}
              placeholder="249"
            />
            <PriceInput
              label="Annual"
              value={plan?.annualPrice ?? null}
              onChange={v => plan && setPlan(p => p ? { ...p, annualPrice: v } : p)}
              placeholder="799"
            />
          </div>
          {plan?.subsEnabled && plan.monthlyPrice && plan.quarterlyPrice && (
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>
              Quarterly saves {Math.round((1 - (plan.quarterlyPrice / 3) / plan.monthlyPrice) * 100)}% vs monthly
              {plan.annualPrice && ` · Annual saves ${Math.round((1 - (plan.annualPrice / 12) / plan.monthlyPrice) * 100)}% vs monthly`}
            </div>
          )}
        </div>
      </div>

      {/* ── Article unlock ── */}
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Article unlock</span>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>Readers pay once to unlock a specific article.</div>
          </div>
          <button
            onClick={() => plan && setPlan(p => p ? { ...p, unlockEnabled: !p.unlockEnabled } : p)}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              border: `1px solid ${plan?.unlockEnabled ? "#111" : "#ddd"}`,
              background: plan?.unlockEnabled ? "#111" : "#fff",
              color: plan?.unlockEnabled ? "#fff" : "#555",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.12s",
            }}
          >
            {plan?.unlockEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        <div style={{ padding: "18px", opacity: plan?.unlockEnabled ? 1 : 0.45, pointerEvents: plan?.unlockEnabled ? "auto" : "none" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 16 }}>
            <PriceInput
              label="Default price (applies to all articles unless overridden)"
              value={plan?.defaultUnlockPrice ?? null}
              onChange={v => plan && setPlan(p => p ? { ...p, defaultUnlockPrice: v } : p)}
              placeholder="29"
            />
          </div>

          {/* Per-URL overrides */}
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 10 }}>Per-URL price overrides</div>

            {contentPrices.length > 0 && (
              <div style={{ border: "1px solid #ebebeb", borderRadius: 6, overflow: "hidden", marginBottom: 10 }}>
                {contentPrices.map((cp, i) => (
                  <div key={cp.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 36px", alignItems: "center", padding: "9px 12px", borderBottom: i < contentPrices.length - 1 ? "1px solid #f5f5f5" : "none", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#333", fontFamily: "monospace" }}>{cp.urlPattern}</div>
                      {cp.label && <div style={{ fontSize: 11, color: "#bbb", marginTop: 1 }}>{cp.label}</div>}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>₹{(cp.price / 100).toFixed(0)}</div>
                    <div style={{ fontSize: 11, color: "#aaa" }}>per unlock</div>
                    <button
                      onClick={() => removeUrlPrice(cp.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", padding: 0, display: "flex", alignItems: "center" }}
                      className="hover:text-[#e54] transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px auto", gap: 8, alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>URL pattern</div>
                <input
                  type="text"
                  placeholder="/articles/premium/*"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  style={{ width: "100%", border: "1px solid #ddd", borderRadius: 6, padding: "7px 10px", fontSize: 12, outline: "none", fontFamily: "monospace", boxSizing: "border-box" }}
                  className="focus:border-[#111]"
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Label (optional)</div>
                <input
                  type="text"
                  placeholder="Premium article"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  style={{ width: "100%", border: "1px solid #ddd", borderRadius: 6, padding: "7px 10px", fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  className="focus:border-[#111]"
                />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Price (₹)</div>
                <input
                  type="number"
                  min={0}
                  placeholder="49"
                  value={newPrice != null ? (newPrice / 100) : ""}
                  onChange={e => setNewPrice(e.target.value === "" ? null : Math.round(parseFloat(e.target.value) * 100))}
                  style={{ width: "100%", border: "1px solid #ddd", borderRadius: 6, padding: "7px 10px", fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                  className="focus:border-[#111]"
                />
              </div>
              <button
                onClick={addUrlPrice}
                disabled={!newUrl.trim() || newPrice == null || addingUrl}
                style={{ padding: "7px 12px", borderRadius: 6, background: "#111", color: "#fff", border: "none", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit", opacity: (!newUrl.trim() || newPrice == null) ? 0.4 : 1 }}
              >
                <Plus size={13} />
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={savePlan}
          disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 6, background: saved ? "#22c55e" : "#111", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "background 0.2s", opacity: saving ? 0.7 : 1 }}
        >
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? "Saved" : saving ? "Saving…" : "Save plans"}
        </button>
      </div>
    </div>
  )
}
