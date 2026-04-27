"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CopySiteKey({ siteKey }: { siteKey: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(siteKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <code className="text-mono text-xs text-[var(--color-text-secondary)] bg-[var(--muted)] px-2 py-0.5 rounded truncate max-w-[200px]">
        {siteKey}
      </code>
      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={copy}>
        {copied ? <Check size={12} className="text-[var(--color-success,#059669)]" /> : <Copy size={12} />}
      </Button>
    </div>
  )
}
