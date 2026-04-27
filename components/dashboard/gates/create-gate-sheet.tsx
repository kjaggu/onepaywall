"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, ArrowLeft, ArrowRight, Clock, AlertTriangle } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type Domain = { id: string; name: string; domain: string }

// ── URL analysis ───────────────────────────────────────────────────────────────

function isSlugLike(seg: string): boolean {
  return seg.length > 18 || seg.split("-").length > 3
}

type ScopeOption = { label: string; pattern: string; description: string }

type UrlAnalysis = {
  isHomepage: boolean
  matchedDomain: Domain | null
  scopeOptions: ScopeOption[]
  path: string
}

function analyseUrl(raw: string, domains: Domain[]): UrlAnalysis | null {
  let url: URL
  try { url = new URL(raw) } catch { return null }

  const path = url.pathname
  const isHomepage = path === "/" || path === ""
  const matchedDomain =
    domains.find(d => url.hostname === d.domain || url.hostname === `www.${d.domain}`) ?? null

  if (isHomepage) return { isHomepage: true, matchedDomain, scopeOptions: [], path }

  const segments = path.split("/").filter(Boolean)
  const structural: string[] = []
  for (const seg of segments) {
    if (isSlugLike(seg)) break
    structural.push(seg)
  }

  const options: ScopeOption[] = [
    {
      label: "All content on this domain",
      pattern: "/*",
      description: "Gates every page except whitelisted paths",
    },
  ]
  for (let i = 0; i < structural.length; i++) {
    const prefix = "/" + structural.slice(0, i + 1).join("/")
    options.push({
      label: `All ${structural.slice(0, i + 1).map(s => `/${s}`).join("")} pages`,
      pattern: `${prefix}/*`,
      description: `Matches ${prefix}/*`,
    })
  }
  options.push({
    label: "This exact URL only",
    pattern: path,
    description: `Only ${path}`,
  })

  return { isHomepage: false, matchedDomain, scopeOptions: options, path }
}

function autoName(pattern: string): string {
  if (pattern === "/*") return "Full site gate"
  const segs = pattern.split("/").filter(s => s && s !== "*")
  if (segs.length === 0) return "Site gate"
  return segs.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" / ") + " gate"
}

const FREE_OPTIONS = [
  { hours: null,  label: "Always gate",  description: "Gate triggers on every visit" },
  { hours: 24,    label: "24 hours",     description: "Free for 24h after publication" },
  { hours: 36,    label: "36 hours",     description: "Free for 36h after publication" },
  { hours: 48,    label: "48 hours",     description: "Free for 48h after publication" },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateGateSheet({ domains }: { domains: Domain[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1)

  const [sampleUrl, setSampleUrl] = useState("")
  const [domainId, setDomainId] = useState(domains[0]?.id ?? "")
  const [selectedPattern, setSelectedPattern] = useState("")
  const [freeForHours, setFreeForHours] = useState<number | null>(null)
  const [gateName, setGateName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const analysis = sampleUrl.startsWith("http") ? analyseUrl(sampleUrl, domains) : null

  function reset() {
    setWizardStep(1)
    setSampleUrl("")
    setDomainId(domains[0]?.id ?? "")
    setSelectedPattern("")
    setFreeForHours(null)
    setGateName("")
    setError("")
  }

  function goToStep2() {
    if (!analysis || analysis.isHomepage || analysis.scopeOptions.length === 0) return
    if (analysis.matchedDomain) setDomainId(analysis.matchedDomain.id)
    // Default to the most specific structural option (second-to-last, before "exact URL")
    const defaultOpt =
      analysis.scopeOptions.length > 2
        ? analysis.scopeOptions[analysis.scopeOptions.length - 2]
        : analysis.scopeOptions[0]
    setSelectedPattern(defaultOpt.pattern)
    setGateName(autoName(defaultOpt.pattern))
    setWizardStep(2)
  }

  async function create() {
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/gates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainId,
          name: gateName || autoName(selectedPattern),
          triggerConditions: freeForHours ? { freeForHours } : {},
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to create gate"); return }

      const gateId = data.gate.id

      // Add URL rule for non-catchall patterns (no rule = all content)
      if (selectedPattern && selectedPattern !== "/*") {
        await fetch(`/api/gates/${gateId}/rules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pattern: selectedPattern, matchType: "path_glob" }),
        })
      }

      setOpen(false)
      reset()
      router.push(`/gates/${gateId}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => { setOpen(v); if (!v) reset() }}>
      <SheetTrigger className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
        <Plus size={14} />
        New gate
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {wizardStep === 1 && "Set up a gate"}
            {wizardStep === 2 && "What should this gate cover?"}
            {wizardStep === 3 && "Review & create"}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-5 px-1">
          {/* Progress bar */}
          <div className="flex items-center gap-1.5">
            {([1, 2, 3] as const).map(s => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= wizardStep ? "bg-[var(--color-brand)]" : "bg-[var(--muted)]"
                }`}
              />
            ))}
          </div>

          {/* ── Step 1 ── */}
          {wizardStep === 1 && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-label text-[var(--color-text)]">
                  Paste a sample article URL
                </label>
                <Input
                  placeholder="https://yoursite.com/articles/some-post"
                  value={sampleUrl}
                  onChange={e => setSampleUrl(e.target.value)}
                  autoFocus
                />
                <p className="text-body-sm text-[var(--muted-foreground)]">
                  We'll read the URL structure and suggest which pages to gate.
                </p>
              </div>

              {analysis?.isHomepage && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-body-sm text-amber-800">
                    This looks like a homepage. Gates on homepages drive readers away — paste an article URL instead.
                  </p>
                </div>
              )}

              {analysis && !analysis.isHomepage && (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2.5 flex flex-col gap-0.5">
                  <p className="text-body-sm text-[var(--muted-foreground)]">
                    Path detected: <code className="text-mono font-medium text-[var(--color-text)]">{analysis.path}</code>
                  </p>
                  {analysis.matchedDomain ? (
                    <p className="text-body-sm text-[var(--muted-foreground)]">
                      Domain matched: <span className="font-medium text-[var(--color-text)]">{analysis.matchedDomain.name}</span>
                    </p>
                  ) : (
                    <p className="text-body-sm text-amber-700">URL host doesn't match any registered domain — select one below.</p>
                  )}
                </div>
              )}

              {(!analysis?.matchedDomain) && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-label text-[var(--color-text)]">Domain</label>
                  <select
                    value={domainId}
                    onChange={e => setDomainId(e.target.value)}
                    className="h-8 w-full rounded-lg border border-[var(--input)] bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  >
                    {domains.map(d => (
                      <option key={d.id} value={d.id}>{d.name} — {d.domain}</option>
                    ))}
                  </select>
                </div>
              )}

              <Button
                onClick={goToStep2}
                disabled={!analysis || analysis.isHomepage || analysis.scopeOptions.length === 0}
                className="gap-1.5"
              >
                Next <ArrowRight size={14} />
              </Button>
            </>
          )}

          {/* ── Step 2 ── */}
          {wizardStep === 2 && analysis && (
            <>
              <div className="flex flex-col gap-2">
                <p className="text-label text-[var(--muted-foreground)]">Gate scope</p>
                {analysis.scopeOptions.map(opt => (
                  <button
                    key={opt.pattern}
                    type="button"
                    onClick={() => { setSelectedPattern(opt.pattern); setGateName(autoName(opt.pattern)) }}
                    className={cn(
                      "flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-left transition-colors",
                      selectedPattern === opt.pattern
                        ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle,#f0fafa)]"
                        : "border-[var(--border)] hover:bg-[var(--muted)]",
                    )}
                  >
                    <div>
                      <p className="text-body font-medium text-[var(--color-text)]">{opt.label}</p>
                      <p className="text-body-sm text-[var(--muted-foreground)] mt-0.5">{opt.description}</p>
                    </div>
                    <code className="text-mono text-xs text-[var(--muted-foreground)] shrink-0 mt-0.5">{opt.pattern}</code>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-[var(--muted-foreground)]" />
                  <p className="text-label text-[var(--color-text)]">Keep new content free for</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {FREE_OPTIONS.map(opt => (
                    <button
                      key={String(opt.hours)}
                      type="button"
                      onClick={() => setFreeForHours(opt.hours)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                        freeForHours === opt.hours
                          ? "border-[var(--color-brand)] bg-[var(--color-brand-subtle,#f0fafa)] font-semibold text-[var(--color-brand)]"
                          : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {freeForHours && (
                  <p className="text-body-sm text-[var(--muted-foreground)]">
                    Articles are free for {freeForHours}h after publication. Add{" "}
                    <code className="text-mono">data-published-at="2024-01-01T10:00:00Z"</code>{" "}
                    to your embed script tag so we can read the publish date.
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setWizardStep(1)} className="gap-1.5">
                  <ArrowLeft size={14} /> Back
                </Button>
                <Button onClick={() => setWizardStep(3)} disabled={!selectedPattern} className="flex-1 gap-1.5">
                  Review <ArrowRight size={14} />
                </Button>
              </div>
            </>
          )}

          {/* ── Step 3 ── */}
          {wizardStep === 3 && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-label text-[var(--color-text)]">Gate name</label>
                <Input value={gateName} onChange={e => setGateName(e.target.value)} />
              </div>

              <div className="rounded-lg border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-body-sm text-[var(--muted-foreground)]">Domain</span>
                  <span className="text-body-sm font-medium">{domains.find(d => d.id === domainId)?.name}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-body-sm text-[var(--muted-foreground)]">URL pattern</span>
                  <code className="text-mono text-xs">{selectedPattern}</code>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-body-sm text-[var(--muted-foreground)]">Freshness window</span>
                  <span className="text-body-sm font-medium">
                    {freeForHours ? `${freeForHours}h free after publication` : "Always gate"}
                  </span>
                </div>
              </div>

              <p className="text-body-sm text-[var(--muted-foreground)]">
                After creating, you'll add the steps readers move through — ads, subscriptions, or one-time payments.
              </p>

              {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setWizardStep(2)} className="gap-1.5">
                  <ArrowLeft size={14} /> Back
                </Button>
                <Button onClick={create} disabled={loading || !gateName} className="flex-1">
                  {loading ? "Creating…" : "Create gate →"}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
