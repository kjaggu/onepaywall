"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

type Plan = {
  currency:        string
  monthlyPrice:    number | null
  quarterlyPrice:  number | null
  annualPrice:     number | null
  subsEnabled:     boolean
}

const EMPTY: Plan = {
  currency:       "INR",
  monthlyPrice:   null,
  quarterlyPrice: null,
  annualPrice:    null,
  subsEnabled:    false,
}

function PriceInput({
  label, value, onChange, placeholder, disabled,
}: {
  label:        string
  value:        number | null
  onChange:     (v: number | null) => void
  placeholder?: string
  disabled?:    boolean
}) {
  return (
    <div style={{ flex: 1 }}>
      <div className="text-label text-[var(--color-text-secondary)] mb-1">{label}</div>
      <div className="flex items-center border border-[var(--color-border)] rounded-md overflow-hidden">
        <span className="px-2.5 py-1.5 text-body-sm text-[var(--color-text-secondary)] border-r border-[var(--color-border)] bg-[var(--color-surface)]">₹</span>
        <input
          type="number"
          min={0}
          step={1}
          placeholder={placeholder ?? "0"}
          disabled={disabled}
          value={value != null ? (value / 100) : ""}
          onChange={e => onChange(e.target.value === "" ? null : Math.round(parseFloat(e.target.value) * 100))}
          className="flex-1 border-0 px-2.5 py-1.5 text-body-sm outline-none disabled:opacity-50"
        />
      </div>
    </div>
  )
}

export function SubscriptionsForm() {
  const [plan, setPlan]     = useState<Plan>(EMPTY)
  const [loading, setLoad]  = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const load = useCallback(async () => {
    setLoad(true)
    const res = await fetch("/api/publisher-plans")
    if (res.ok) {
      const data = await res.json()
      const p = data.plan
      setPlan(p ? {
        currency:       p.currency       ?? "INR",
        monthlyPrice:   p.monthlyPrice   ?? null,
        quarterlyPrice: p.quarterlyPrice ?? null,
        annualPrice:    p.annualPrice    ?? null,
        subsEnabled:    p.subsEnabled    ?? false,
      } : EMPTY)
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
        currency:       plan.currency,
        monthlyPrice:   plan.monthlyPrice,
        quarterlyPrice: plan.quarterlyPrice,
        annualPrice:    plan.annualPrice,
        subsEnabled:    plan.subsEnabled,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  if (loading) {
    return (
      <div className="border border-[var(--color-border)] rounded-xl p-6 animate-pulse">
        <div className="h-4 w-32 bg-[var(--muted)] rounded mb-3" />
        <div className="h-3 w-64 bg-[var(--muted)] rounded" />
      </div>
    )
  }

  const disabled = !plan.subsEnabled

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div>
            <p className="text-body font-semibold text-[var(--color-text)]">Subscriptions</p>
            <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
              Readers pay a recurring fee to access all your gated content.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Switch
              checked={plan.subsEnabled}
              onChange={v => setPlan(p => ({ ...p, subsEnabled: v }))}
              label="Enable subscriptions"
            />
            <span
              className="text-body-sm"
              style={{ color: plan.subsEnabled ? "var(--color-text)" : "var(--color-text-secondary)" }}
            >
              {plan.subsEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>

        <div
          className="p-5 transition-opacity"
          style={{ opacity: disabled ? 0.45 : 1, pointerEvents: disabled ? "none" : "auto" }}
        >
          <div className="flex gap-3">
            <PriceInput
              label="Monthly"
              value={plan.monthlyPrice}
              onChange={v => setPlan(p => ({ ...p, monthlyPrice: v }))}
              placeholder="99"
              disabled={disabled}
            />
            <PriceInput
              label="Quarterly"
              value={plan.quarterlyPrice}
              onChange={v => setPlan(p => ({ ...p, quarterlyPrice: v }))}
              placeholder="249"
              disabled={disabled}
            />
            <PriceInput
              label="Annual"
              value={plan.annualPrice}
              onChange={v => setPlan(p => ({ ...p, annualPrice: v }))}
              placeholder="799"
              disabled={disabled}
            />
          </div>

          {plan.subsEnabled && plan.monthlyPrice && plan.quarterlyPrice && (
            <p className="text-body-sm text-[var(--color-text-secondary)] mt-3">
              Quarterly saves {Math.round((1 - (plan.quarterlyPrice / 3) / plan.monthlyPrice) * 100)}% vs monthly
              {plan.annualPrice && ` · Annual saves ${Math.round((1 - (plan.annualPrice / 12) / plan.monthlyPrice) * 100)}% vs monthly`}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-1.5">
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? "Saved" : saving ? "Saving…" : "Save subscriptions"}
        </Button>
      </div>
    </div>
  )
}
