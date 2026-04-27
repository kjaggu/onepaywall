"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type Rule = { id: string; pattern: string; matchType: "path_glob" | "content_type" }

// Segment heuristics: slug-like → *, structural → keep
function inferGlob(path: string): string {
  const segments = path.split("/").filter(Boolean)
  const mapped = segments.map(seg => {
    if (/^\d{1,4}$/.test(seg)) return seg          // numeric (year/month/day) — keep
    if (seg.length > 18 || seg.split("-").length > 3) return "*"  // slug — generalise
    return seg
  })
  const glob = "/" + mapped.join("/") + (path.endsWith("/") ? "/" : "")
  return glob === path ? path : glob               // no change if already generic
}

function extractPath(raw: string): string | null {
  try {
    const u = new URL(raw)
    return u.pathname || "/"
  } catch {
    return null
  }
}

type Suggestion = { glob: string; exact: string } | null

function getSuggestion(pattern: string): Suggestion {
  if (!pattern.startsWith("http://") && !pattern.startsWith("https://")) return null
  const path = extractPath(pattern)
  if (!path) return null
  return { glob: inferGlob(path), exact: path }
}

export function GateRules({ gateId, initialRules }: { gateId: string; initialRules: Rule[] }) {
  const router = useRouter()
  const [pattern, setPattern] = useState("")
  const [matchType, setMatchType] = useState<"path_glob" | "content_type">("path_glob")
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState("")

  const suggestion = getSuggestion(pattern)

  async function addRule(finalPattern: string, e?: React.FormEvent) {
    e?.preventDefault()
    setError("")
    setAdding(true)
    try {
      const res = await fetch(`/api/gates/${gateId}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern: finalPattern, matchType }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to add rule"); return }
      setPattern("")
      router.refresh()
    } finally {
      setAdding(false)
    }
  }

  async function removeRule(ruleId: string) {
    await fetch(`/api/gates/${gateId}/rules/${ruleId}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="border border-[var(--border)] rounded-lg p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-h3 text-[var(--color-text)]">URL rules</h2>
        <p className="text-body-sm text-[var(--muted-foreground)] mt-0.5">
          Gate applies to matching paths. No rules = applies to all content.
        </p>
      </div>

      {initialRules.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {initialRules.map(rule => (
            <div key={rule.id} className="flex items-center gap-1.5 bg-[var(--muted)] rounded-md px-2.5 py-1">
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                {rule.matchType === "path_glob" ? "glob" : "type"}
              </Badge>
              <code className="text-mono text-xs text-[var(--color-text)]">{rule.pattern}</code>
              <button onClick={() => removeRule(rule.id)} className="text-[var(--muted-foreground)] hover:text-[var(--destructive)] ml-1">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={e => addRule(suggestion ? suggestion.glob : pattern, e)} className="flex flex-col gap-2">
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-label text-[var(--muted-foreground)]">
              Pattern — or paste a sample URL to derive one
            </label>
            <Input
              placeholder="https://yoursite.com/articles/some-post  or  /articles/*"
              value={pattern}
              onChange={e => setPattern(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label text-[var(--muted-foreground)]">Type</label>
            <select
              value={matchType}
              onChange={e => setMatchType(e.target.value as "path_glob" | "content_type")}
              className="h-8 rounded-lg border border-[var(--input)] bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="path_glob">Path glob</option>
              <option value="content_type">Content type</option>
            </select>
          </div>
          {!suggestion && (
            <Button type="submit" size="sm" disabled={adding} className="gap-1.5 shrink-0">
              <Plus size={13} />
              Add
            </Button>
          )}
        </div>

        {/* URL-derived suggestion */}
        {suggestion && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
              <Wand2 size={12} />
              Derived from URL — choose how to apply
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addRule(suggestion.glob)}
                disabled={adding}
                className="flex items-center gap-1.5 rounded-md border border-[var(--color-brand)] bg-[var(--color-brand-subtle,#f0fafa)] px-3 py-1.5 text-xs font-semibold text-[var(--color-brand)] hover:bg-[var(--color-brand-subtle)] transition-colors"
              >
                <Wand2 size={11} />
                Use pattern: <code className="font-mono ml-1">{suggestion.glob}</code>
              </button>
              {suggestion.exact !== suggestion.glob && (
                <button
                  type="button"
                  onClick={() => addRule(suggestion.exact)}
                  disabled={adding}
                  className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
                >
                  Use exact path: <code className="font-mono ml-1">{suggestion.exact}</code>
                </button>
              )}
            </div>
          </div>
        )}
      </form>

      {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
    </div>
  )
}
