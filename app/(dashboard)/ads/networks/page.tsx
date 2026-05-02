"use client"

import { useCallback, useEffect, useState } from "react"
import { Network, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConnectAdsenseSheet } from "@/components/dashboard/ads/connect-adsense-sheet"
import { ConnectGAMSheet } from "@/components/dashboard/ads/connect-gam-sheet"

type NetworkRow = {
  id: string
  provider: "google_adsense" | "google_ad_manager"
  active: boolean
  updatedAt: string
}

const PROVIDER_LABELS: Record<string, string> = {
  google_adsense:      "Google AdSense",
  google_ad_manager:   "Google Ad Manager",
}

export default function AdsNetworksPage() {
  const [networks, setNetworks] = useState<NetworkRow[]>([])
  const [loading, setLoading] = useState(true)
  const [adsenseOpen, setAdsenseOpen] = useState(false)
  const [gamOpen, setGamOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ads/networks")
      if (res.ok) {
        const json = await res.json()
        setNetworks(json.networks ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/ads/networks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    })
    setNetworks(prev => prev.map(n => n.id === id ? { ...n, active } : n))
  }

  async function disconnect(id: string) {
    await fetch(`/api/ads/networks/${id}`, { method: "DELETE" })
    setNetworks(prev => prev.filter(n => n.id !== id))
  }

  const connectedProviders = new Set(networks.map(n => n.provider))

  return (
    <div className="flex flex-col gap-6">
      {/* Connected networks */}
      {networks.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-body font-semibold text-[var(--color-text)]">Connected networks</h2>
          <div className="flex flex-col gap-2">
            {networks.map(n => (
              <div
                key={n.id}
                className="flex items-center justify-between border border-[var(--color-border)] rounded-xl px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <Network size={18} className="text-[var(--color-text-secondary)]" />
                  <div>
                    <p className="text-body-sm font-medium text-[var(--color-text)]">
                      {PROVIDER_LABELS[n.provider] ?? n.provider}
                    </p>
                    <p className="text-body-sm text-[var(--color-text-secondary)]">
                      {n.active ? "Active" : "Paused"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(n.id, !n.active)}
                  >
                    {n.active ? "Pause" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnect(n.id)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connect new network */}
      <div className="flex flex-col gap-3">
        <h2 className="text-body font-semibold text-[var(--color-text)]">
          {networks.length === 0 ? "Connect an ad network" : "Add another network"}
        </h2>
        {networks.length === 0 && !loading && (
          <p className="text-body-sm text-[var(--color-text-secondary)]">
            Connect a network to use it as backfill when no direct creative matches.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 max-w-lg">
          <button
            onClick={() => setAdsenseOpen(true)}
            disabled={connectedProviders.has("google_adsense")}
            className="flex flex-col items-start gap-2 border border-[var(--color-border)] rounded-xl p-5 text-left hover:border-[var(--color-brand)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Network size={20} className="text-[var(--color-text-secondary)]" />
            <div>
              <p className="text-body-sm font-semibold text-[var(--color-text)]">Google AdSense</p>
              <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
                {connectedProviders.has("google_adsense") ? "Connected" : "Connect with publisher ID"}
              </p>
            </div>
          </button>
          <button
            onClick={() => setGamOpen(true)}
            disabled={connectedProviders.has("google_ad_manager")}
            className="flex flex-col items-start gap-2 border border-[var(--color-border)] rounded-xl p-5 text-left hover:border-[var(--color-brand)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Network size={20} className="text-[var(--color-text-secondary)]" />
            <div>
              <p className="text-body-sm font-semibold text-[var(--color-text)]">Google Ad Manager</p>
              <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
                {connectedProviders.has("google_ad_manager") ? "Connected" : "Connect with network code"}
              </p>
            </div>
          </button>
        </div>
      </div>

      <ConnectAdsenseSheet
        open={adsenseOpen}
        onOpenChange={setAdsenseOpen}
        onConnected={load}
      />
      <ConnectGAMSheet
        open={gamOpen}
        onOpenChange={setGamOpen}
        onConnected={load}
      />
    </div>
  )
}
