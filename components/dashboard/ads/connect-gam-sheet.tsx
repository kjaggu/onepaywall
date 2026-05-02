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

export function ConnectGAMSheet({ open, onOpenChange, onConnected }: Props) {
  const [networkCode, setNetworkCode] = useState("")
  const [adUnitRootPath, setAdUnitRootPath] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setNetworkCode("")
    setAdUnitRootPath("")
    setError(null)
  }

  async function handleSave() {
    if (!networkCode.trim()) { setError("Network code is required"); return }
    if (!adUnitRootPath.trim()) { setError("Ad unit root path is required"); return }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/ads/networks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "google_ad_manager",
          credentials: { networkCode: networkCode.trim(), adUnitRootPath: adUnitRootPath.trim() },
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? "Failed to connect GAM")
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
          <SheetTitle>Connect Google Ad Manager</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-5 px-4 pb-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-[var(--color-text)]">
              Network Code
            </label>
            <input
              className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-body-sm outline-none focus:border-[var(--color-brand)]"
              placeholder="12345678"
              value={networkCode}
              onChange={e => setNetworkCode(e.target.value)}
            />
            <p className="text-body-sm text-[var(--color-text-secondary)]">
              Found in your GAM account under Admin → Network settings.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-[var(--color-text)]">
              Ad Unit Root Path
            </label>
            <input
              className="border border-[var(--color-border)] rounded-lg px-3 py-2 text-body-sm outline-none focus:border-[var(--color-brand)]"
              placeholder="/12345678/my-site"
              value={adUnitRootPath}
              onChange={e => setAdUnitRootPath(e.target.value)}
            />
            <p className="text-body-sm text-[var(--color-text-secondary)]">
              The root ad unit path used when creating ad slots for your site.
            </p>
          </div>

          {error && <p className="text-body-sm text-red-600">{error}</p>}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? "Connecting…" : "Connect Ad Manager"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
