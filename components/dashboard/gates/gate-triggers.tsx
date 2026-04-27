"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Save, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type DeviceType = "any" | "mobile" | "desktop" | "tablet"

export type TriggerConditions = {
  minVisitCount?: number
  maxVisitCount?: number
  deviceType?:    DeviceType
  freeForHours?:  number
}

// Number-or-blank input. We persist `undefined` for "no constraint", not 0.
function NumberInput({
  value,
  onChange,
  placeholder,
  min = 0,
}: {
  value: number | undefined
  onChange: (v: number | undefined) => void
  placeholder?: string
  min?: number
}) {
  return (
    <Input
      type="number"
      value={value ?? ""}
      placeholder={placeholder}
      min={min}
      onChange={e => {
        const raw = e.target.value
        if (raw === "") onChange(undefined)
        else {
          const n = Number(raw)
          onChange(Number.isFinite(n) && n >= min ? n : undefined)
        }
      }}
    />
  )
}

export function GateTriggers({
  gateId,
  initialConditions,
}: {
  gateId: string
  initialConditions: TriggerConditions
}) {
  const router = useRouter()
  const [conditions, setConditions] = useState<TriggerConditions>(initialConditions)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)

  function patch<K extends keyof TriggerConditions>(key: K, value: TriggerConditions[K]) {
    setConditions(c => ({ ...c, [key]: value }))
  }

  async function save() {
    setSaving(true); setError(null)

    // Strip undefined keys so the JSON column stays compact.
    const clean: TriggerConditions = {}
    if (conditions.minVisitCount != null) clean.minVisitCount = conditions.minVisitCount
    if (conditions.maxVisitCount != null) clean.maxVisitCount = conditions.maxVisitCount
    if (conditions.deviceType && conditions.deviceType !== "any") clean.deviceType = conditions.deviceType
    if (conditions.freeForHours != null && conditions.freeForHours > 0) clean.freeForHours = conditions.freeForHours

    const res = await fetch(`/api/gates/${gateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ triggerConditions: clean }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Could not save triggers.")
      setSaving(false)
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="border border-[var(--color-border)] rounded-xl p-5 flex flex-col gap-5">
      <div>
        <h2 className="text-h3 text-[var(--color-text)]">Triggers</h2>
        <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
          Optional rules that decide <em>when</em> this gate fires for a reader. Leave blank to apply to everyone.
        </p>
      </div>

      <Field
        label="Show only after this many visits"
        hint="Reader's running visit count (per domain). Leave blank to show from visit 1."
      >
        <NumberInput
          value={conditions.minVisitCount}
          onChange={v => patch("minVisitCount", v)}
          placeholder="e.g. 3"
          min={1}
        />
      </Field>

      <Field
        label="Stop showing after this many visits"
        hint="Useful for soft paywalls. Leave blank for no upper limit."
      >
        <NumberInput
          value={conditions.maxVisitCount}
          onChange={v => patch("maxVisitCount", v)}
          placeholder="e.g. 10"
          min={1}
        />
      </Field>

      <Field
        label="Device type"
        hint="Some publishers run mobile-only paywalls. Defaults to all devices."
      >
        <select
          value={conditions.deviceType ?? "any"}
          onChange={e => patch("deviceType", e.target.value as DeviceType)}
          className="h-8 w-fit rounded-lg border border-[var(--input)] bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="any">Any device</option>
          <option value="mobile">Mobile only</option>
          <option value="desktop">Desktop only</option>
          <option value="tablet">Tablet only</option>
        </select>
      </Field>

      <Field
        label="Free for the first N hours after publish"
        hint={
          <>
            Articles published less than N hours ago will skip this gate. Requires <code className="font-mono text-xs bg-[var(--color-surface)] px-1 py-0.5 rounded">data-published-at</code> on the embed script.
          </>
        }
      >
        <div className="flex items-center gap-2">
          <NumberInput
            value={conditions.freeForHours}
            onChange={v => patch("freeForHours", v)}
            placeholder="e.g. 24"
            min={1}
          />
          <span className="text-body-sm text-[var(--color-text-secondary)]">hours</span>
        </div>
      </Field>

      {error && (
        <div className="text-body-sm text-[#922118]">{error}</div>
      )}

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-1.5">
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? "Saved" : saving ? "Saving…" : "Save triggers"}
        </Button>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-body-sm font-medium text-[var(--color-text)]">{label}</label>
      {hint && <p className="text-label text-[var(--color-text-secondary)] leading-relaxed">{hint}</p>}
      <div className="mt-1">{children}</div>
    </div>
  )
}
