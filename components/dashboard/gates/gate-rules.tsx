"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type Rule = { id: string; pattern: string; matchType: "path_glob" | "content_type" }

export function GateRules({ gateId, initialRules }: { gateId: string; initialRules: Rule[] }) {
  const router = useRouter()
  const [pattern, setPattern] = useState("")
  const [matchType, setMatchType] = useState<"path_glob" | "content_type">("path_glob")
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState("")

  async function addRule(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setAdding(true)
    try {
      const res = await fetch(`/api/gates/${gateId}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern, matchType }),
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
              <Badge variant="outline" className="text-[10px] px-1 py-0">{rule.matchType === "path_glob" ? "glob" : "type"}</Badge>
              <code className="text-mono text-xs text-[var(--color-text)]">{rule.pattern}</code>
              <button onClick={() => removeRule(rule.id)} className="text-[var(--muted-foreground)] hover:text-[var(--destructive)] ml-1">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={addRule} className="flex items-end gap-2">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-label text-[var(--muted-foreground)]">Pattern</label>
          <Input
            placeholder="/articles/*"
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
        <Button type="submit" size="sm" disabled={adding} className="gap-1.5 shrink-0">
          <Plus size={13} />
          Add
        </Button>
      </form>
      {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
    </div>
  )
}
