import Link from "next/link"
import { Lock, ChevronRight } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { listGatesForPublisher } from "@/lib/db/queries/gates"
import { listDomains } from "@/lib/db/queries/domains"
import { Badge } from "@/components/ui/badge"
import { CreateGateSheet } from "@/components/dashboard/gates/create-gate-sheet"

export default async function GatesPage() {
  const session = await getSession()
  const publisherId = session?.publisherId

  const [rows, domains] = await Promise.all([
    publisherId ? listGatesForPublisher(publisherId) : [],
    publisherId ? listDomains(publisherId) : [],
  ])

  // Group gates by domain
  const byDomain = rows.reduce<Record<string, { domain: (typeof rows)[0]["domain"]; gates: (typeof rows)[0]["gate"][] }>>(
    (acc, { gate, domain }) => {
      if (!acc[domain.id]) acc[domain.id] = { domain, gates: [] }
      acc[domain.id].gates.push(gate)
      return acc
    },
    {},
  )
  const domainGroups = Object.values(byDomain)

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h1 text-[var(--color-text)]">Gates</h1>
          <p className="text-body-sm text-[var(--color-text-secondary)] mt-1">
            Configure paywall gates and the step sequences readers see.
          </p>
        </div>
        <CreateGateSheet domains={domains.map(d => ({ id: d.id, name: d.name, domain: d.domain }))} />
      </div>

      {rows.length === 0 ? (
        <div className="border border-[var(--border)] rounded-lg flex flex-col items-center justify-center py-20 text-center">
          <Lock size={36} className="text-[var(--border)] mb-3" />
          <p className="text-body font-medium text-[var(--color-text-secondary)]">No gates yet</p>
          <p className="text-body-sm text-[var(--muted-foreground)] max-w-xs mt-1 mb-5">
            Create your first gate to define how readers are monetised on your domains.
          </p>
          <CreateGateSheet domains={domains.map(d => ({ id: d.id, name: d.name, domain: d.domain }))} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {domainGroups.map(({ domain, gates }) => (
            <div key={domain.id}>
              <p className="text-label text-[var(--muted-foreground)] mb-2 uppercase tracking-wide">
                {domain.name} — {domain.domain}
              </p>
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                {gates.map((gate, i) => {
                  const live = gate.enabled && domain.embedEnabled && domain.status === "active"
                  return (
                  <Link
                    key={gate.id}
                    href={`/gates/${gate.id}`}
                    className={`flex items-center gap-4 px-4 py-3 hover:bg-[var(--muted)] transition-colors group ${
                      i < gates.length - 1 ? "border-b border-[var(--border)]" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-[var(--color-text)] truncate">{gate.name}</p>
                      <p className="text-body-sm text-[var(--muted-foreground)]">Priority {gate.priority}</p>
                    </div>
                    <Badge variant={live ? "default" : "secondary"} className="shrink-0">
                      {live ? "Enabled" : "Paused"}
                    </Badge>
                    <ChevronRight size={15} className="text-[var(--muted-foreground)] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
