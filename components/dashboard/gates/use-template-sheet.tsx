"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button, buttonVariants } from "@/components/ui/button"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { GateTemplate } from "@/lib/gates/templates"

type Domain = { id: string; name: string; domain: string }

const STEP_LABELS: Record<string, string> = {
  subscription_cta: "Subscription CTA",
  one_time_unlock: "Pay to unlock",
  ad: "View ad",
}

export function UseTemplateSheet({
  template,
  domains,
}: {
  template: GateTemplate
  domains: Domain[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(template.name)
  const [domainId, setDomainId] = useState(domains[0]?.id ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function reset() {
    setName(template.name)
    setDomainId(domains[0]?.id ?? "")
    setError("")
    setLoading(false)
  }

  async function create() {
    if (!domainId) return
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/gates/from-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id, domainId, name: name.trim() || template.name }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to create gate"); return }
      setOpen(false)
      reset()
      router.push(`/gates/${data.gate.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => { setOpen(v); if (!v) reset() }}>
      <SheetTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full mt-3")}>
        Use this template
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Set up: {template.name}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-5 px-1">
          {/* Step flow preview */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] px-4 py-3">
            <p className="text-label text-[var(--muted-foreground)] mb-2">Reader flow</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {template.steps.map((step, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className="rounded-full bg-[var(--color-brand)] px-2.5 py-0.5 text-xs font-semibold text-white">
                    {STEP_LABELS[step.stepType] ?? step.stepType}
                  </span>
                  {i < template.steps.length - 1 && (
                    <span className="text-xs text-[var(--muted-foreground)]">→</span>
                  )}
                </span>
              ))}
            </div>
            <p className="text-body-sm text-[var(--muted-foreground)] mt-2">{template.description}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-label text-[var(--color-text)]">Gate name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={template.name}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-label text-[var(--color-text)]">Domain</label>
            {domains.length === 0 ? (
              <p className="text-body-sm text-[var(--destructive)]">
                Add a domain first before creating a gate.
              </p>
            ) : (
              <select
                value={domainId}
                onChange={e => setDomainId(e.target.value)}
                className="h-9 w-full rounded-lg border border-[var(--input)] bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                {domains.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.domain}
                  </option>
                ))}
              </select>
            )}
          </div>

          <p className="text-body-sm text-[var(--muted-foreground)]">
            The gate will apply to all pages (<code className="text-mono">/**</code>). You can adjust URL rules and step
            pricing in the gate builder after creation.
          </p>

          {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}

          <Button
            onClick={create}
            disabled={loading || !domainId || !name.trim()}
          >
            {loading ? "Creating…" : "Create gate →"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
