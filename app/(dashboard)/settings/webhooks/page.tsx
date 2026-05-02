"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Trash2, Webhook, ToggleLeft, ToggleRight } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

type WebhookRow = {
  id: string
  event: string
  url: string
  active: boolean
  createdAt: string
}

const EVENT_LABELS: Record<string, string> = {
  lead_captured: "Lead captured",
}

export default function WebhooksSettingsPage() {
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/publisher-webhooks")
    if (res.ok) {
      const data = await res.json()
      setWebhooks(data.webhooks ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleActive(hook: WebhookRow) {
    await fetch(`/api/publisher-webhooks/${hook.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !hook.active }),
    })
    load()
  }

  async function handleDelete(hook: WebhookRow) {
    if (!confirm("Delete this webhook?")) return
    await fetch(`/api/publisher-webhooks/${hook.id}`, { method: "DELETE" })
    load()
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-lg bg-[var(--color-brand-subtle)] flex items-center justify-center shrink-0">
          <Webhook size={18} className="text-[var(--color-brand)]" />
        </div>
        <div>
          <h1 className="text-h1 text-[var(--color-text)]">Webhooks</h1>
          <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
            Fire HTTP POST notifications to your CRM or automation tools when readers submit their email.
          </p>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
            <Plus size={14} />
            Add webhook
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Add webhook</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-5 px-4 pb-4 mt-2">
              <AddWebhookForm onCreated={() => { setSheetOpen(false); load() }} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
          {[0, 1].map(i => (
            <div key={i} style={{ padding: "14px 18px", borderBottom: i === 0 ? "1px solid var(--color-border)" : "none", display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ flex: 1, height: 12, background: "#f0f0f0", borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <div className="border border-dashed border-[var(--color-border)] rounded-xl p-12 text-center">
          <p className="text-body font-medium text-[var(--color-text)]">No webhooks yet</p>
          <p className="text-body-sm text-[var(--color-text-secondary)] mt-1 max-w-sm mx-auto">
            Configure an endpoint URL to receive a POST whenever a reader submits the lead capture form.
          </p>
        </div>
      ) : (
        <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 80px 40px 36px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid var(--color-border)" }}>
            {["URL", "Event", "Status", "", ""].map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>
          {webhooks.map((hook, i) => (
            <div
              key={hook.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 140px 80px 40px 36px",
                padding: "11px 18px",
                borderBottom: i < webhooks.length - 1 ? "1px solid var(--color-border)" : "none",
                alignItems: "center",
                background: "#fff",
              }}
            >
              <div style={{ fontSize: 12, color: "#444", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                {hook.url}
              </div>

              <div>
                <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, background: "#eff6ff", color: "#2563eb", fontWeight: 500 }}>
                  {EVENT_LABELS[hook.event] ?? hook.event}
                </span>
              </div>

              <div style={{ fontSize: 12, color: hook.active ? "#16a34a" : "#aaa" }}>
                {hook.active ? "Active" : "Paused"}
              </div>

              <button
                onClick={() => toggleActive(hook)}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 2 }}
                title={hook.active ? "Pause" : "Activate"}
              >
                {hook.active
                  ? <ToggleRight size={18} stroke="#22c55e" />
                  : <ToggleLeft size={18} stroke="#ccc" />
                }
              </button>

              <button
                onClick={() => handleDelete(hook)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#ddd", display: "flex", padding: 2 }}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AddWebhookForm({ onCreated }: { onCreated: () => void }) {
  const [event, setEvent] = useState("lead_captured")
  const [url, setUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.startsWith("https://")) {
      setError("URL must start with https://")
      return
    }

    setSaving(true)
    setError(null)
    const res = await fetch("/api/publisher-webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, url }),
    })
    if (res.ok) {
      onCreated()
    } else {
      const d = await res.json()
      setError(d.error ?? "Failed to save webhook")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-text)]">Event</label>
        <select
          value={event}
          onChange={e => setEvent(e.target.value)}
          className="border border-[var(--color-border)] rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
        >
          <option value="lead_captured">Lead captured</option>
        </select>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Fired when a reader submits the lead capture gate step.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--color-text)]">Endpoint URL</label>
        <input
          className="border border-[var(--color-border)] rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent font-mono"
          placeholder="https://hooks.zapier.com/…"
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <p className="text-xs text-[var(--color-text-secondary)]">
          OnePaywall will POST JSON with <code className="bg-[var(--color-surface)] px-1 rounded">{"{ email, name, publisherId, capturedAt }"}</code>.
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={saving} className="mt-1">
        {saving ? "Saving…" : "Save webhook"}
      </Button>
    </form>
  )
}
