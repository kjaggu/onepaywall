import { Sliders } from "lucide-react"

export default function AdsSettingsTab() {
  return (
    <div className="border border-dashed border-[var(--color-border)] rounded-xl p-12 text-center max-w-2xl">
      <Sliders size={28} className="mx-auto mb-3 text-[var(--color-text-secondary)]" />
      <p className="text-body font-medium text-[var(--color-text)]">Ads settings</p>
      <p className="text-body-sm text-[var(--color-text-secondary)] mt-1 max-w-md mx-auto">
        Default skip-after seconds, frequency caps, and ad placement rules across your gates. Coming soon.
      </p>
    </div>
  )
}
