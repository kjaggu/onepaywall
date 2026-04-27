"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EmbedVerifyButton({ domainId, verified }: { domainId: string; verified: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(verified)
  const [error, setError] = useState<string | null>(null)

  if (done) {
    return (
      <div className="flex items-center gap-2 text-body-sm text-[var(--color-success)]">
        <CheckCircle2 size={14} className="shrink-0" />
        Embed verified — gates can be enabled on this domain.
      </div>
    )
  }

  async function verify() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/domains/${domainId}/verify-embed`, { method: "POST" })
      const data = await res.json()
      if (data.verified) {
        setDone(true)
        router.refresh()
      } else {
        setError(data.reason ?? "Verification failed.")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={verify} disabled={loading}>
          {loading && <Loader2 size={13} className="animate-spin" />}
          {loading ? "Checking…" : "Verify installation"}
        </Button>
        <p className="text-body-sm text-[var(--color-text-secondary)]">
          We'll check your domain's homepage for the embed script.
        </p>
      </div>
      {error && (
        <div className="flex items-start gap-2 text-body-sm text-[var(--color-destructive)]">
          <XCircle size={14} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}
    </div>
  )
}
