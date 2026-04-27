"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EmbedVerifyButton({ domainId, verified }: { domainId: string; verified: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(verified)

  if (done) {
    return (
      <div className="flex items-center gap-2 text-body-sm text-[var(--color-success)]">
        <CheckCircle2 size={14} className="shrink-0" />
        Embed verified — gates can be enabled on this domain.
      </div>
    )
  }

  async function markVerified() {
    setLoading(true)
    const res = await fetch(`/api/domains/${domainId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embedEnabled: true }),
    })
    setLoading(false)
    if (res.ok) {
      setDone(true)
      router.refresh()
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button size="sm" onClick={markVerified} disabled={loading}>
        {loading && <Loader2 size={13} className="animate-spin" />}
        {loading ? "Verifying…" : "Mark as installed"}
      </Button>
      <p className="text-body-sm text-[var(--color-text-secondary)]">
        Done installing the snippet? Click to unlock gate activation on this domain.
      </p>
    </div>
  )
}
