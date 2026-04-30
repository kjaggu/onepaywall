"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertCircle, Check, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

type Plan = {
  currency:        string
  monthlyPrice:    number | null
  quarterlyPrice:  number | null
  annualPrice:     number | null
  subsEnabled:     boolean
  monthlyRazorpayPlanId?: string | null
  quarterlyRazorpayPlanId?: string | null
  annualRazorpayPlanId?: string | null
  monthlySyncError?: string | null
  quarterlySyncError?: string | null
  annualSyncError?: string | null
}

type SyncStatus = Record<"monthly" | "quarterly" | "annual", "not_configured" | "synced" | "needs_resync" | "error">
type Gateway = {
  mode: "platform" | "own"
  keyIdSet: boolean
  keySecretSet: boolean
  webhookSecretSet: boolean
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
  const [error, setError]   = useState("")
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    monthly: "not_configured",
    quarterly: "not_configured",
    annual: "not_configured",
  })
  const [gateway, setGateway] = useState<Gateway | null>(null)

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
        monthlyRazorpayPlanId: p.monthlyRazorpayPlanId ?? null,
        quarterlyRazorpayPlanId: p.quarterlyRazorpayPlanId ?? null,
        annualRazorpayPlanId: p.annualRazorpayPlanId ?? null,
        monthlySyncError: p.monthlySyncError ?? null,
        quarterlySyncError: p.quarterlySyncError ?? null,
        annualSyncError: p.annualSyncError ?? null,
      } : EMPTY)
      setSyncStatus({
        monthly: data.syncStatus?.monthly ?? "not_configured",
        quarterly: data.syncStatus?.quarterly ?? "not_configured",
        annual: data.syncStatus?.annual ?? "not_configured",
      })
      setGateway(data.paymentGateway ?? null)
    }
    setLoad(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function save() {
    setSaving(true)
    setError("")
    const res = await fetch("/api/publisher-plans", {
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
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.error ?? "Could not save subscription plans.")
      return
    }
    if (data.plan) {
      setPlan(p => ({
        ...p,
        monthlyRazorpayPlanId: data.plan.monthlyRazorpayPlanId ?? null,
        quarterlyRazorpayPlanId: data.plan.quarterlyRazorpayPlanId ?? null,
        annualRazorpayPlanId: data.plan.annualRazorpayPlanId ?? null,
        monthlySyncError: data.plan.monthlySyncError ?? null,
        quarterlySyncError: data.plan.quarterlySyncError ?? null,
        annualSyncError: data.plan.annualSyncError ?? null,
      }))
    }
    setSyncStatus({
      monthly: data.syncStatus?.monthly ?? "not_configured",
      quarterly: data.syncStatus?.quarterly ?? "not_configured",
      annual: data.syncStatus?.annual ?? "not_configured",
    })
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
  const ownKeysIncomplete = gateway?.mode === "own" && (!gateway.keyIdSet || !gateway.keySecretSet)
  const webhookWarning = gateway?.mode === "own" && !gateway.webhookSecretSet
  const planIds = {
    monthly: plan.monthlyRazorpayPlanId,
    quarterly: plan.quarterlyRazorpayPlanId,
    annual: plan.annualRazorpayPlanId,
  }

  function statusLabel(interval: "monthly" | "quarterly" | "annual") {
    const status = syncStatus[interval]
    if (status === "synced") return planIds[interval] ?? "Synced"
    if (status === "needs_resync") return "Needs resync"
    if (status === "error") return "Error"
    return "Not configured"
  }

  function statusColor(status: SyncStatus[keyof SyncStatus]) {
    if (status === "synced") return "var(--color-success)"
    if (status === "error") return "var(--color-danger)"
    if (status === "needs_resync") return "var(--color-warning)"
    return "var(--color-text-secondary)"
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div>
            <p className="text-body font-semibold text-[var(--color-text)]">Subscriptions</p>
            <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
              Readers pay a recurring fee to access all gated content across your publication.
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

          <div className="grid grid-cols-3 gap-3 mt-4">
            {(["monthly", "quarterly", "annual"] as const).map(interval => (
              <div key={interval} className="rounded-md border border-[var(--color-border)] px-3 py-2">
                <div className="text-label text-[var(--color-text-secondary)] capitalize">{interval}</div>
                <div
                  className="text-body-sm font-semibold mt-1"
                  style={{
                    color: statusColor(syncStatus[interval]),
                    fontFamily: syncStatus[interval] === "synced" && planIds[interval] ? "var(--font-geist-mono), monospace" : "inherit",
                    overflowWrap: "anywhere",
                  }}
                >
                  {statusLabel(interval)}
                </div>
              </div>
            ))}
          </div>

          {plan.subsEnabled && plan.monthlyPrice && plan.quarterlyPrice && (
            <p className="text-body-sm text-[var(--color-text-secondary)] mt-3">
              Quarterly saves {Math.round((1 - (plan.quarterlyPrice / 3) / plan.monthlyPrice) * 100)}% vs monthly
              {plan.annualPrice && ` · Annual saves ${Math.round((1 - (plan.annualPrice / 12) / plan.monthlyPrice) * 100)}% vs monthly`}
            </p>
          )}
        </div>
      </div>

      {ownKeysIncomplete && plan.subsEnabled && (
        <div className="flex items-start gap-2 rounded-lg border border-[var(--color-danger)] bg-red-50 px-4 py-3 text-sm text-[var(--color-danger)]">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          Connect your Razorpay Key ID and Key Secret in Payment Gateway settings before enabling subscriptions.
        </div>
      )}

      {webhookWarning && plan.subsEnabled && (
        <div className="flex items-start gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          Add your Razorpay webhook secret so renewals, cancellations, and failed payments stay in sync.
        </div>
      )}

      {(plan.monthlySyncError || plan.quarterlySyncError || plan.annualSyncError || error) && (
        <div className="rounded-lg border border-[var(--color-danger)] bg-red-50 px-4 py-3 text-sm text-[var(--color-danger)]">
          {error || plan.monthlySyncError || plan.quarterlySyncError || plan.annualSyncError}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-1.5">
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? "Saved" : saving ? "Syncing…" : "Save and sync plans"}
        </Button>
      </div>
    </div>
  )
}
