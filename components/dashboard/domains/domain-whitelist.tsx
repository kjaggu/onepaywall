"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, Plus, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function extractPath(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    // Full URL — extract just the path
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://x.com${trimmed}`)
    return url.pathname || "/"
  } catch {
    return null
  }
}

export function DomainWhitelist({
  domainId,
  initialPaths,
}: {
  domainId: string
  initialPaths: string[]
}) {
  const router = useRouter()
  const [paths, setPaths] = useState<string[]>(initialPaths)
  const [input, setInput] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  async function save(next: string[]) {
    setSaving(true)
    await fetch(`/api/domains/${domainId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whitelistedPaths: next }),
    })
    setSaving(false)
    router.refresh()
  }

  function add() {
    setError("")
    const path = extractPath(input)
    if (!path) {
      setError("Enter a valid URL or path (e.g. /about or https://example.com/about)")
      return
    }
    if (paths.includes(path)) {
      setError("This path is already whitelisted.")
      return
    }
    const next = [...paths, path]
    setPaths(next)
    setInput("")
    save(next)
  }

  function remove(path: string) {
    const next = paths.filter(p => p !== path)
    setPaths(next)
    save(next)
  }

  return (
    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-2">
        <ShieldCheck size={16} className="text-[var(--color-brand)]" />
        <h2 className="text-body font-semibold text-[var(--color-text)]">Free pages</h2>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-body-sm text-[var(--color-text-secondary)]">
          Pages listed here are never gated — the embed script skips them entirely. Paste a full URL or a
          path like <code className="font-mono text-xs bg-[var(--color-surface)] border border-[var(--color-border)] px-1 py-0.5 rounded">/about</code>.
        </p>

        {/* Input row */}
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/about  or  /about"
            value={input}
            onChange={e => { setInput(e.target.value); setError("") }}
            onKeyDown={e => e.key === "Enter" && add()}
            className="flex-1 font-mono text-xs"
          />
          <Button size="sm" onClick={add} disabled={saving || !input.trim()} className="gap-1.5 shrink-0">
            <Plus size={13} />
            Add
          </Button>
        </div>
        {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}

        {/* Whitelisted paths list */}
        {paths.length > 0 ? (
          <ul className="space-y-1.5">
            {paths.map(path => (
              <li
                key={path}
                className="flex items-center justify-between gap-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2"
              >
                <code className="font-mono text-xs text-[var(--color-text)] truncate">{path}</code>
                <button
                  onClick={() => remove(path)}
                  disabled={saving}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] shrink-0 transition-colors"
                  aria-label={`Remove ${path}`}
                >
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-sm text-[var(--color-text-secondary)] italic">
            No pages whitelisted — all pages are eligible for gating.
          </p>
        )}
      </div>
    </div>
  )
}
