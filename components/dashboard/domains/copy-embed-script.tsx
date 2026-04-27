"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { copyText } from "@/lib/copy"

export function CopyEmbedScript({ siteKey }: { siteKey: string }) {
  const [copied, setCopied] = useState(false)

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.onepaywall.com").replace(/\/$/, "")
  const snippet = `<script src="${appUrl}/embed/embed.js" data-site-key="${siteKey}" data-api-base="${appUrl}" async></script>`

  async function copy() {
    await copyText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <span className="text-xs text-[var(--color-text-secondary)]">HTML</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copy}
          className="h-6 gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
        >
          {copied ? (
            <>
              <Check size={12} className="text-[var(--color-success)]" />
              Copied
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="text-xs font-mono text-[var(--color-text-secondary)] bg-[var(--color-bg)] px-4 py-3 overflow-x-auto whitespace-pre-wrap break-all">
        {snippet}
      </pre>
    </div>
  )
}
