"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, Plus, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

type Plan = {
  defaultUnlockPrice: number | null
  unlockEnabled:      boolean
}

type ContentPrice = {
  id:         string
  urlPattern: string
  price:      number
  label:      string | null
}

const EMPTY: Plan = {
  defaultUnlockPrice: null,
  unlockEnabled:      false,
}

export function ArticleUnlockForm() {
  const [plan, setPlan] = useState<Plan>(EMPTY)
  const [contentPrices, setContentPrices] = useState<ContentPrice[]>([])
  const [loading, setLoad]  = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const [newUrl, setNewUrl]       = useState("")
  const [newPrice, setNewPrice]   = useState<number | null>(null)
  const [newLabel, setNewLabel]   = useState("")
  const [addingUrl, setAddingUrl] = useState(false)

  const load = useCallback(async () => {
    setLoad(true)
    const res = await fetch("/api/publisher-plans")
    if (res.ok) {
      const data = await res.json()
      const p = data.plan
      setPlan(p ? {
        defaultUnlockPrice: p.defaultUnlockPrice ?? null,
        unlockEnabled:      p.unlockEnabled      ?? false,
      } : EMPTY)
      setContentPrices(data.contentPrices ?? [])
    }
    setLoad(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function save() {
    setSaving(true)
    await fetch("/api/publisher-plans", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        defaultUnlockPrice: plan.defaultUnlockPrice,
        unlockEnabled:      plan.unlockEnabled,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
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
      <div className="border border-[var(--color-border)] rounded-xl p-6 animate-pulse">
        <div className="h-4 w-32 bg-[var(--muted)] rounded mb-3" />
        <div className="h-3 w-64 bg-[var(--muted)] rounded" />
      </div>
    )
  }

  const disabled = !plan.unlockEnabled

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div>
            <p className="text-body font-semibold text-[var(--color-text)]">Article unlock</p>
            <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
              Readers pay once to unlock a specific article.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Switch
              checked={plan.unlockEnabled}
              onChange={v => setPlan(p => ({ ...p, unlockEnabled: v }))}
              label="Enable article unlock"
            />
            <span
              className="text-body-sm"
              style={{ color: plan.unlockEnabled ? "var(--color-text)" : "var(--color-text-secondary)" }}
            >
              {plan.unlockEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>

        <div
          className="p-5 transition-opacity flex flex-col gap-5"
          style={{ opacity: disabled ? 0.45 : 1, pointerEvents: disabled ? "none" : "auto" }}
        >
          {/* Default price */}
          <div>
            <div className="text-label text-[var(--color-text-secondary)] mb-1">
              Default price (applies to all articles unless overridden)
            </div>
            <div className="flex items-center border border-[var(--color-border)] rounded-md overflow-hidden max-w-xs">
              <span className="px-2.5 py-1.5 text-body-sm text-[var(--color-text-secondary)] border-r border-[var(--color-border)] bg-[var(--color-surface)]">₹</span>
              <input
                type="number"
                min={0}
                placeholder="29"
                disabled={disabled}
                value={plan.defaultUnlockPrice != null ? (plan.defaultUnlockPrice / 100) : ""}
                onChange={e => setPlan(p => ({
                  ...p,
                  defaultUnlockPrice: e.target.value === "" ? null : Math.round(parseFloat(e.target.value) * 100),
                }))}
                className="flex-1 border-0 px-2.5 py-1.5 text-body-sm outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Per-URL overrides */}
          <div className="border-t border-[var(--color-border)] pt-5">
            <p className="text-body font-semibold text-[var(--color-text)] mb-1">Per-URL price overrides</p>
            <p className="text-body-sm text-[var(--color-text-secondary)] mb-4">
              Charge a different unlock price for specific URL patterns. Most-specific match wins.
            </p>

            {contentPrices.length > 0 && (
              <div className="border border-[var(--color-border)] rounded-md overflow-hidden mb-3">
                {contentPrices.map((cp, i) => (
                  <div
                    key={cp.id}
                    className="grid grid-cols-[1fr_80px_120px_36px] items-center px-3 py-2 gap-3"
                    style={{ borderBottom: i < contentPrices.length - 1 ? "1px solid var(--color-border)" : "none" }}
                  >
                    <div>
                      <div className="text-body-sm font-mono text-[var(--color-text)]">{cp.urlPattern}</div>
                      {cp.label && <div className="text-label text-[var(--color-text-secondary)] mt-0.5">{cp.label}</div>}
                    </div>
                    <div className="text-body-sm font-semibold text-[var(--color-text)]">₹{(cp.price / 100).toFixed(0)}</div>
                    <div className="text-label text-[var(--color-text-secondary)]">per unlock</div>
                    <button
                      onClick={() => removeUrlPrice(cp.id)}
                      className="bg-transparent border-0 cursor-pointer text-[var(--color-text-tertiary)] hover:text-[var(--destructive)] transition-colors flex items-center"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-[1fr_140px_120px_auto] gap-2 items-end">
              <div>
                <div className="text-label text-[var(--color-text-secondary)] mb-1">URL pattern</div>
                <input
                  type="text"
                  placeholder="/articles/premium/*"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-md px-2.5 py-1.5 text-body-sm font-mono outline-none focus:border-[var(--color-text)]"
                />
              </div>
              <div>
                <div className="text-label text-[var(--color-text-secondary)] mb-1">Label (optional)</div>
                <input
                  type="text"
                  placeholder="Premium article"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-md px-2.5 py-1.5 text-body-sm outline-none focus:border-[var(--color-text)]"
                />
              </div>
              <div>
                <div className="text-label text-[var(--color-text-secondary)] mb-1">Price (₹)</div>
                <input
                  type="number"
                  min={0}
                  placeholder="49"
                  value={newPrice != null ? (newPrice / 100) : ""}
                  onChange={e => setNewPrice(e.target.value === "" ? null : Math.round(parseFloat(e.target.value) * 100))}
                  className="w-full border border-[var(--color-border)] rounded-md px-2.5 py-1.5 text-body-sm outline-none focus:border-[var(--color-text)]"
                />
              </div>
              <Button
                size="sm"
                onClick={addUrlPrice}
                disabled={!newUrl.trim() || newPrice == null || addingUrl}
                className="gap-1.5"
              >
                <Plus size={13} />
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-1.5">
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? "Saved" : saving ? "Saving…" : "Save article unlock"}
        </Button>
      </div>
    </div>
  )
}
