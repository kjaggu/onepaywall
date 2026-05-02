"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnected: () => void
}

export function ConnectAdsenseSheet({ open, onOpenChange, onConnected }: Props) {
  const [adClientId, setAdClientId] = useState("")
  const [tosAccepted, setTosAccepted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setAdClientId("")
    setTosAccepted(false)
    setError(null)
  }

  async function handleSave() {
    if (!adClientId.trim()) { setError("Publisher ID is required"); return }
    if (!tosAccepted) { setError("You must accept the ToS acknowledgment"); return }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/ads/networks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "google_adsense",
          credentials: { adClientId: adClientId.trim() },
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? "Failed to connect AdSense")
      }
      onConnected()
      onOpenChange(false)
      reset()
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={v => { onOpenChange(v); if (!v) reset() }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Connect Google AdSense</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-5 px-4 pb-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-[var(--color-text)]">
              AdSense Publisher ID
            </label>
            <input
              className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-body-sm outline-none focus:border-[var(--color-brand)]"
              placeholder="ca-pub-XXXXXXXXXXXXXXXX"
              value={adClientId}
              onChange={e => setAdClientId(e.target.value)}
            />
            <p className="text-body-sm text-[var(--color-text-secondary)]">
              Found in your AdSense account under Account → Account information.
            </p>
          </div>

          <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
            <p className="text-body-sm text-amber-800 font-medium mb-2">AdSense placement policy</p>
            <p className="text-body-sm text-amber-700">
              Google AdSense restricts ads in interstitials that prevent access to content.
              Ensure your use of AdSense within OnePaywall gates complies with the
              {" "}<a href="https://support.google.com/adsense/answer/48182" target="_blank" rel="noopener noreferrer" className="underline">Google AdSense Program Policies</a>.
              Consider using Google Ad Manager for more placement flexibility.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 flex-shrink-0"
              checked={tosAccepted}
              onChange={e => setTosAccepted(e.target.checked)}
            />
            <span className="text-body-sm text-[var(--color-text)]">
              I confirm that my use of AdSense within OnePaywall gates complies with Google AdSense
              Program Policies, including restrictions on interstitial ad placements.
            </span>
          </label>

          {error && <p className="text-body-sm text-red-600">{error}</p>}

          <Button
            onClick={handleSave}
            disabled={saving || !tosAccepted}
            className="w-full"
          >
            {saving ? "Connecting…" : "Connect AdSense"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
