"use client"

import { useCallback, useEffect, useState } from "react"
import { Send, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Campaign = {
  id: string
  name: string
  subject: string
  status: string
  recipientCount: number | null
  sentAt: string | null
  scheduledAt: string | null
  createdAt: string
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  draft:     { bg: "#f5f5f5", color: "#888",    label: "Draft"     },
  scheduled: { bg: "#eff6ff", color: "#2563eb", label: "Scheduled" },
  sending:   { bg: "#fff7ed", color: "#ea580c", label: "Sending"   },
  sent:      { bg: "#f0fdf4", color: "#16a34a", label: "Sent"      },
  cancelled: { bg: "#fef2f2", color: "#dc2626", label: "Cancelled" },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: "#f5f5f5", color: "#888", label: status }
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  )
}

function CreateCampaignSheet({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", subject: "", bodyHtml: "", segmentFilter: "" })
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    let segmentFilter = null
    try {
      if (form.segmentFilter.trim()) segmentFilter = JSON.parse(form.segmentFilter)
    } catch {
      alert("Invalid segment filter JSON")
      setSaving(false)
      return
    }
    const res = await fetch("/api/email/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:          form.name,
        subject:       form.subject,
        bodyHtml:      form.bodyHtml,
        segmentFilter,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setOpen(false)
      setForm({ name: "", subject: "", bodyHtml: "", segmentFilter: "" })
      onCreated()
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
        <Plus size={14} />
        New campaign
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New campaign</SheetTitle>
        </SheetHeader>
        <form onSubmit={submit} className="flex flex-col gap-4 px-4 pb-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-[#555]">Campaign name</label>
            <input
              className="border border-[#ebebeb] rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#111]"
              placeholder="March newsletter"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-[#555]">Subject line</label>
            <input
              className="border border-[#ebebeb] rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#111]"
              placeholder="This month in finance"
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-[#555]">Body HTML</label>
            <textarea
              className="border border-[#ebebeb] rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#111] font-mono min-h-[200px] resize-y"
              placeholder="<p>Hello!</p>"
              value={form.bodyHtml}
              onChange={e => setForm(f => ({ ...f, bodyHtml: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-[#555]">
              Segment filter <span className="text-[#bbb] font-normal">(JSON, optional — leave empty for all subscribers)</span>
            </label>
            <textarea
              className="border border-[#ebebeb] rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#111] font-mono min-h-[80px] resize-y"
              placeholder={`{\n  "segment": "power_user"\n}`}
              value={form.segmentFilter}
              onChange={e => setForm(f => ({ ...f, segmentFilter: e.target.value }))}
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

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/email/campaigns")
    if (res.ok) setCampaigns((await res.json()).campaigns ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function markSending(campaign: Campaign) {
    if (!confirm(`Send "${campaign.name}" to all matching subscribers now?`)) return
    await fetch(`/api/email/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sending" }),
    })
    load()
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Send size={18} strokeWidth={1.5} className="text-[#111]" />
          <h1 className="text-[17px] font-semibold text-[#111]">Campaigns</h1>
        </div>
        <CreateCampaignSheet onCreated={load} />
      </div>

      {loading ? (
        <div className="text-[13px] text-[#bbb]">Loading…</div>
      ) : campaigns.length === 0 ? (
        <div className="border border-dashed border-[#ddd] rounded-lg p-8 text-center">
          <Send size={20} strokeWidth={1.2} className="text-[#ccc] mx-auto mb-2" />
          <p className="text-[13px] text-[#888]">No campaigns yet. Create one to send your first broadcast.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {campaigns.map(c => (
            <div key={c.id} className="border border-[#ebebeb] rounded-lg px-4 py-3 bg-white flex items-center justify-between gap-4">
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[#111] truncate">{c.name}</span>
                  <StatusBadge status={c.status} />
                </div>
                <span className="text-[12px] text-[#999] truncate">{c.subject}</span>
                {c.sentAt && (
                  <span className="text-[11px] text-[#bbb]">
                    {new Date(c.sentAt).toLocaleDateString()} · {c.recipientCount ?? 0} recipients
                  </span>
                )}
              </div>
              {c.status === "draft" && (
                <Button size="sm" variant="outline" onClick={() => markSending(c)}>
                  Send now
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
