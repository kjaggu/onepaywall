import { AlertTriangle } from "lucide-react"

export default function DangerZonePage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-lg bg-[#fdecea] flex items-center justify-center shrink-0">
          <AlertTriangle size={18} className="text-[#922118]" />
        </div>
        <div>
          <h1 className="text-h1 text-[var(--color-text)]">Danger zone</h1>
          <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
            Irreversible actions. Read carefully before acting.
          </p>
        </div>
      </div>

      <div className="border border-dashed border-[#f5b5b0] rounded-xl p-12 text-center">
        <p className="text-body font-medium text-[var(--color-text)]">Coming soon</p>
        <p className="text-body-sm text-[var(--color-text-secondary)] mt-1 max-w-sm mx-auto">
          Export all data, delete the publisher account, transfer ownership.
        </p>
      </div>
    </div>
  )
}
