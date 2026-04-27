import { Network } from "lucide-react"

export default function AdsNetworksTab() {
  return (
    <div className="border border-dashed border-[var(--color-border)] rounded-xl p-12 text-center max-w-2xl">
      <Network size={28} className="mx-auto mb-3 text-[var(--color-text-secondary)]" />
      <p className="text-body font-medium text-[var(--color-text)]">Ad networks</p>
      <p className="text-body-sm text-[var(--color-text-secondary)] mt-1 max-w-md mx-auto">
        Connect Google AdSense, Google Ad Manager, or other supported networks for backfill when no direct creative matches.
        Coming soon.
      </p>
    </div>
  )
}
