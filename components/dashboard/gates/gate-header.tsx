"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type Gate = {
  id: string
  name: string
  priority: number
  enabled: boolean
}

type Domain = {
  id: string
  name: string
  domain: string
  embedEnabled: boolean
  status: string
}

export function GateHeader({ gate, domain }: { gate: Gate; domain: Domain }) {
  const router = useRouter()
  const [name, setName] = useState(gate.name)
  const [priority, setPriority] = useState(String(gate.priority))
  const [enabled, setEnabled] = useState(gate.enabled)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const canEnable = domain.embedEnabled && domain.status === "active"

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/gates/${gate.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, priority: Number(priority), enabled }),
    })
    if (!res.ok && enabled) {
      setEnabled(false)
    }
    setSaving(false)
    setDirty(false)
    router.refresh()
  }

  async function remove() {
    if (!confirm(`Delete gate "${gate.name}"? This cannot be undone.`)) return
    await fetch(`/api/gates/${gate.id}`, { method: "DELETE" })
    router.push("/gates")
  }

  function handleChange<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setDirty(true) }
  }

  return (
    <div className="border border-[var(--border)] rounded-lg p-5 flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-label text-[var(--muted-foreground)]">Gate name</label>
            <Input
              value={name}
              onChange={e => handleChange(setName)(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-label text-[var(--muted-foreground)]">Priority</label>
              <Input
                type="number"
                value={priority}
                onChange={e => handleChange(setPriority)(e.target.value)}
                className="w-24"
                min={0}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-label text-[var(--muted-foreground)]">Status</label>
              {canEnable ? (
                <button
                  onClick={() => handleChange(setEnabled)(!enabled)}
                  className="flex items-center gap-2 text-sm"
                >
                  <Badge variant={enabled ? "default" : "secondary"}>
                    {enabled ? "Enabled" : "Paused"}
                  </Badge>
                  <span className="text-[var(--muted-foreground)] text-xs">click to toggle</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Paused</Badge>
                  <span className="text-[var(--muted-foreground)] text-xs">disabled</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-body-sm text-[var(--muted-foreground)]">
            Domain: <span className="font-medium">{domain.name}</span> — {domain.domain}
          </p>
          {!canEnable && (
            <div className="flex items-start gap-2 rounded-lg border border-[var(--color-warning)] bg-[var(--color-warning-subtle,#fffbeb)] px-3 py-2.5">
              <AlertTriangle size={14} className="text-[var(--color-warning)] mt-0.5 shrink-0" />
              <p className="text-body-sm text-[var(--color-text-secondary)]">
                This gate cannot be enabled until{" "}
                {domain.status !== "active" ? "the domain is active" : "the embed script is installed on the domain"}
                .{" "}
                <Link
                  href={`/domains/${domain.id}`}
                  className="font-medium text-[var(--color-brand)] hover:underline"
                >
                  Go to domain settings →
                </Link>
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {dirty && (
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={remove}>
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    </div>
  )
}
