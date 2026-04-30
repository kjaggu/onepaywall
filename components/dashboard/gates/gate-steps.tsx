"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type StepType = "ad" | "subscription_cta" | "one_time_unlock"
type StepAction = "proceed" | "next_step"

type Step = {
  id: string
  stepOrder: number
  stepType: StepType
  config: Record<string, unknown>
  onSkip: StepAction
  onDecline: StepAction
}

const STEP_LABELS: Record<StepType, string> = {
  ad: "Ad",
  subscription_cta: "Subscription CTA",
  one_time_unlock: "One-time unlock",
}

const STEP_COLORS: Record<StepType, string> = {
  ad: "default",
  subscription_cta: "secondary",
  one_time_unlock: "outline",
}

function StepConfigEditor({
  step,
  gateId,
  onSaved,
}: {
  step: Step
  gateId: string
  onSaved: () => void
}) {
  const [config, setConfig] = useState<Record<string, unknown>>(step.config)
  const [onSkip, setOnSkip] = useState<StepAction>(step.onSkip)
  const [onDecline, setOnDecline] = useState<StepAction>(step.onDecline)
  const [saving, setSaving] = useState(false)

  function set(key: string, value: unknown) {
    setConfig(c => ({ ...c, [key]: value }))
  }

  async function save() {
    setSaving(true)
    await fetch(`/api/gates/${gateId}/steps/${step.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config, onSkip, onDecline }),
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-col gap-3">
      {step.stepType === "subscription_cta" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-label text-[var(--muted-foreground)]">Heading</label>
              <Input value={String(config.heading ?? "")} onChange={e => set("heading", e.target.value)} placeholder="Support our journalism" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-label text-[var(--muted-foreground)]">CTA label</label>
              <Input value={String(config.ctaLabel ?? "")} onChange={e => set("ctaLabel", e.target.value)} placeholder="Subscribe now" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-label text-[var(--muted-foreground)]">Subtext</label>
            <Input value={String(config.subtext ?? "")} onChange={e => set("subtext", e.target.value)} placeholder="Unlimited access from ₹99/month" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-label text-[var(--muted-foreground)]">CTA URL</label>
            <Input value={String(config.ctaUrl ?? "")} onChange={e => set("ctaUrl", e.target.value)} placeholder="https://example.com/subscribe" />
          </div>
        </>
      )}

      {step.stepType === "one_time_unlock" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-label text-[var(--muted-foreground)]">Price (paise)</label>
            <Input type="number" value={String(config.priceInPaise ?? "")} onChange={e => set("priceInPaise", Number(e.target.value))} placeholder="499" min={1} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-label text-[var(--muted-foreground)]">Unlock duration (seconds)</label>
            <Input type="number" value={String(config.unlockDurationSeconds ?? "")} onChange={e => set("unlockDurationSeconds", Number(e.target.value))} placeholder="86400" min={60} />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-label text-[var(--muted-foreground)]">Label</label>
            <Input value={String(config.label ?? "")} onChange={e => set("label", e.target.value)} placeholder="Read this article" />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id={`hideSkip-${step.id}`}
              checked={Boolean(config.hideSkip)}
              onChange={e => set("hideSkip", e.target.checked)}
              className="h-4 w-4 rounded border-[var(--input)] accent-[var(--color-brand)]"
            />
            <label htmlFor={`hideSkip-${step.id}`} className="text-label text-[var(--color-text)] cursor-pointer">
              Hide skip button — reader must pay to proceed
            </label>
          </div>
        </div>
      )}

      {step.stepType === "ad" && (
        <p className="text-body-sm text-[var(--muted-foreground)]">
          Ad units are assigned after you create them in the Ads section.
        </p>
      )}

      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-label text-[var(--muted-foreground)]">On skip</label>
          <select
            value={onSkip}
            onChange={e => setOnSkip(e.target.value as StepAction)}
            className="h-8 rounded-lg border border-[var(--input)] bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="proceed">Proceed (unlock)</option>
            <option value="next_step">Next step</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-label text-[var(--muted-foreground)]">On decline</label>
          <select
            value={onDecline}
            onChange={e => setOnDecline(e.target.value as StepAction)}
            className="h-8 rounded-lg border border-[var(--input)] bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="proceed">Proceed (unlock)</option>
            <option value="next_step">Next step</option>
          </select>
        </div>
        <Button size="sm" onClick={save} disabled={saving} className="mt-auto">
          {saving ? "Saving…" : "Save step"}
        </Button>
      </div>
    </div>
  )
}

export function GateSteps({ gateId, initialSteps }: { gateId: string; initialSteps: Step[] }) {
  const router = useRouter()
  const [newType, setNewType] = useState<StepType>("ad")
  const [adding, setAdding] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function addStep() {
    setAdding(true)
    const res = await fetch(`/api/gates/${gateId}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepType: newType }),
    })
    const data = await res.json()
    setAdding(false)
    if (res.ok) {
      router.refresh()
      setExpandedId(data.step.id)
    }
  }

  async function removeStep(stepId: string) {
    await fetch(`/api/gates/${gateId}/steps/${stepId}`, { method: "DELETE" })
    router.refresh()
  }

  async function moveStep(stepId: string, direction: "up" | "down") {
    const idx = initialSteps.findIndex(s => s.id === stepId)
    const targetIdx = direction === "up" ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= initialSteps.length) return
    const target = initialSteps[targetIdx]
    // Swap orders
    await Promise.all([
      fetch(`/api/gates/${gateId}/steps/${stepId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepOrder: target.stepOrder }),
      }),
      fetch(`/api/gates/${gateId}/steps/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepOrder: initialSteps[idx].stepOrder }),
      }),
    ])
    router.refresh()
  }

  return (
    <div className="border border-[var(--border)] rounded-lg p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-h3 text-[var(--color-text)]">Steps</h2>
        <p className="text-body-sm text-[var(--muted-foreground)] mt-0.5">
          The sequence readers move through. Steps are evaluated in order.
        </p>
      </div>

      {initialSteps.length === 0 && (
        <p className="text-body-sm text-[var(--muted-foreground)]">No steps yet — add one below.</p>
      )}

      <div className="flex flex-col gap-2">
        {initialSteps.map((step, i) => (
          <div key={step.id} className="border border-[var(--border)] rounded-lg p-3">
            <div className="flex items-center gap-3">
              <span className="text-label text-[var(--muted-foreground)] w-5 text-center">{step.stepOrder}</span>
              <Badge variant={STEP_COLORS[step.stepType] as "default" | "secondary" | "outline"}>
                {STEP_LABELS[step.stepType]}
              </Badge>
              <div className="flex-1" />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveStep(step.id, "up")}
                  disabled={i === 0}
                  className="p-1 rounded hover:bg-[var(--muted)] disabled:opacity-30 transition-colors"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => moveStep(step.id, "down")}
                  disabled={i === initialSteps.length - 1}
                  className="p-1 rounded hover:bg-[var(--muted)] disabled:opacity-30 transition-colors"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  onClick={() => setExpandedId(expandedId === step.id ? null : step.id)}
                  className="text-body-sm text-[var(--primary)] px-2 hover:underline"
                >
                  {expandedId === step.id ? "Close" : "Edit"}
                </button>
                <button
                  onClick={() => removeStep(step.id)}
                  className="p-1 rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            {expandedId === step.id && (
              <StepConfigEditor step={step} gateId={gateId} onSaved={() => { router.refresh(); setExpandedId(null) }} />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <select
          value={newType}
          onChange={e => setNewType(e.target.value as StepType)}
          className="h-8 rounded-lg border border-[var(--input)] bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="ad">Ad</option>
          <option value="subscription_cta">Subscription CTA</option>
          <option value="one_time_unlock">One-time unlock</option>
        </select>
        <Button size="sm" onClick={addStep} disabled={adding} className="gap-1.5">
          <Plus size={13} />
          {adding ? "Adding…" : "Add step"}
        </Button>
      </div>
    </div>
  )
}
