import { Bell } from "lucide-react"

export default function NotificationsSettingsPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-lg bg-[var(--color-brand-subtle)] flex items-center justify-center shrink-0">
          <Bell size={18} className="text-[var(--color-brand)]" />
        </div>
        <div>
          <h1 className="text-h1 text-[var(--color-text)]">Notifications</h1>
          <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
            Choose what you and your team get emailed about.
          </p>
        </div>
      </div>

      <div className="border border-dashed border-[var(--color-border)] rounded-xl p-12 text-center">
        <p className="text-body font-medium text-[var(--color-text)]">Coming soon</p>
        <p className="text-body-sm text-[var(--color-text-secondary)] mt-1 max-w-sm mx-auto">
          Daily / weekly digests, payment failures, gate health alerts, and per-domain anomaly detection.
        </p>
      </div>
    </div>
  )
}
