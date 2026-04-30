"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type Position = "bottom" | "top" | "float"

interface Props {
  domainId: string
  enabled: boolean
  position: string
}

export function LogoutWidgetConfig({ domainId, enabled, position }: Props) {
  const [widgetEnabled, setWidgetEnabled] = useState(enabled)
  const [widgetPosition, setWidgetPosition] = useState<Position>((position as Position) || "bottom")
  const [saving, setSaving] = useState(false)

  async function save(patch: { logoutWidgetEnabled?: boolean; logoutWidgetPosition?: string }) {
    setSaving(true)
    try {
      await fetch(`/api/domains/${domainId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(checked: boolean) {
    setWidgetEnabled(checked)
    await save({ logoutWidgetEnabled: checked })
  }

  async function handlePosition(pos: Position) {
    setWidgetPosition(pos)
    await save({ logoutWidgetPosition: pos })
  }

  const positions: { value: Position; label: string; description: string }[] = [
    { value: "bottom", label: "Bottom edge", description: "Tab hugging the bottom of the page" },
    { value: "top", label: "Top edge", description: "Tab hugging the top of the page" },
    { value: "float", label: "Floating pill", description: "Pill floating above the bottom-right corner" },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-body font-medium text-[var(--color-text)]">Show subscriber widget</p>
          <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
            A small badge visible only to recognized subscribers — lets them see their tenure and sign out.
          </p>
        </div>
        <Switch
          checked={widgetEnabled}
          onChange={handleToggle}
          disabled={saving}
          label="Enable subscriber widget"
        />
      </div>

      {widgetEnabled && (
        <div>
          <p className="text-body-sm font-medium text-[var(--color-text)] mb-2">Position</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {positions.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => handlePosition(p.value)}
                disabled={saving}
                className={cn(
                  "text-left px-3 py-2.5 rounded-lg border text-body-sm transition-colors",
                  widgetPosition === p.value
                    ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)] text-[var(--color-text-secondary)]",
                )}
              >
                <span className="font-semibold block text-[var(--color-text)]">{p.label}</span>
                <span className="text-xs">{p.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
