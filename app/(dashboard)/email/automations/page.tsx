"use client"

import { useCallback, useEffect, useState } from "react"
import { Zap, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Automation = {
  id: string
  name: string
  triggerType: string
  triggerConfig: Record<string, unknown>
  subject: string
  status: string
  createdAt: string
}

const TRIGGER_LABELS: Record<string, { label: string; hint: string }> = {
  new_subscriber: {
    label: "New subscriber",
    hint:  "Fires when someone joins your email list",
  },
  segment_entered: {
    label: "Segment entered",
    hint:  "Fires when a reader's profile moves to a new segment",
  },
  ad_engaged: {
    label: "Ad engaged",
    hint:  "Fires when a reader completes or interacts with an ad",
  },
  inactivity: {
    label: "Inactivity",
    hint:  "Fires after a reader hasn't visited for N days",
  },
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft:  { bg: "#f5f5f5", color: "#888"    },
  active: { bg: "#f0fdf4", color: "#16a34a" },
  paused: { bg: "#fff7ed", color: "#ea580c" },
}

function CreateAutomationSheet({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name:          "",
    triggerType:   "new_subscriber",
    triggerConfig: "",
    subject:       "",
    bodyHtml:      "",
  })
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    let triggerConfig = {}
    try {
      if (form.triggerConfig.trim()) triggerConfig = JSON.parse(form.triggerConfig)
    } catch {
      alert("Invalid trigger config JSON")
      setSaving(false)
      return
    }
    const res = await fetch("/api/email/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:          form.name,
        triggerType:   form.triggerType,
        triggerConfig,
        subject:       form.subject,
        bodyHtml:      form.bodyHtml,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setOpen(false)
      setForm({ name: "", triggerType: "new_subscriber", triggerConfig: "", subject: "", bodyHtml: "" })
      onCreated()
    }
  }

  const selected = TRIGGER_LABELS[form.triggerType]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
        <Plus size={14} />
        New automation
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New automation</SheetTitle>
        </SheetHeader>
        <form onSubmit={submit} className="flex flex-col gap-4 px-4 pb-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-[#555]">Name</label>
            <input
              className="border border-[#ebebeb] rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#111]"
              placeholder="Welcome email"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-[#555]">Trigger</label>
            <select
              className="border border-[#ebebeb] rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#111] bg-white"
              value={form.triggerType}
              onChange={e => setForm(f => ({ ...f, triggerType: e.target.value }))}
            >
              {Object.entries(TRIGGER_LABELS).map(([v, { label }]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
            {selected && (
              <p className="text-[11px] text-[#aaa]">{selected.hint}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-[#555]">
              Trigger config <span className="text-[#bbb] font-normal">(JSON, optional)</span>
            </label>
            <textarea
              className="border border-[#ebebeb] rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#111] font-mono min-h-[60px] resize-y"
              placeholder={form.triggerType === "segment_entered"
                ? `{ "targetSegment": "power_user" }`
                : form.triggerType === "inactivity"
                  ? `{ "inactiveDays": 14 }`
                  : ""}
              value={form.triggerConfig}
              onChange={e => setForm(f => ({ ...f, triggerConfig: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-[#555]">Subject line</label>
            <input
              className="border border-[#ebebeb] rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#111]"
              placeholder="Welcome to the newsletter"
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-[#555]">Body HTML</label>
            <textarea
              className="border border-[#ebebeb] rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#111] font-mono min-h-[160px] resize-y"
              placeholder="<p>Thanks for subscribing!</p>"
              value={form.bodyHtml}
              onChange={e => setForm(f => ({ ...f, bodyHtml: e.target.value }))}
              required
            />
          </div>

          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving…" : "Save as draft"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/email/automations")
    if (res.ok) setAutomations((await res.json()).automations ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleStatus(a: Automation) {
    const next = a.status === "active" ? "paused" : "active"
    await fetch(`/api/email/automations/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    load()
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Zap size={18} strokeWidth={1.5} className="text-[#111]" />
          <h1 className="text-[17px] font-semibold text-[#111]">Automations</h1>
        </div>
        <CreateAutomationSheet onCreated={load} />
      </div>

      {loading ? (
        <div className="text-[13px] text-[#bbb]">Loading…</div>
      ) : automations.length === 0 ? (
        <div className="border border-dashed border-[#ddd] rounded-lg p-8 text-center">
          <Zap size={20} strokeWidth={1.2} className="text-[#ccc] mx-auto mb-2" />
          <p className="text-[13px] text-[#888]">
            No automations yet. Create one to send emails automatically based on reader behavior.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {automations.map(a => {
            const trigger = TRIGGER_LABELS[a.triggerType]
            const s = STATUS_STYLE[a.status] ?? STATUS_STYLE.draft
            return (
              <div key={a.id} className="border border-[#ebebeb] rounded-lg px-4 py-3 bg-white flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-[#111] truncate">{a.name}</span>
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {a.status}
                    </span>
                  </div>
                  <span className="text-[12px] text-[#999]">
                    {trigger?.label ?? a.triggerType} · {a.subject}
                  </span>
                </div>
                {a.status !== "draft" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleStatus(a)}
                  >
                    {a.status === "active" ? "Pause" : "Resume"}
                  </Button>
                )}
                {a.status === "draft" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleStatus(a)}
                  >
                    Activate
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
