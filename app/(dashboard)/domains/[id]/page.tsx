import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Code2, ShieldCheck, Settings as SettingsIcon } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { getDomain } from "@/lib/db/queries/domains"
import { listGatesForDomain } from "@/lib/db/queries/gates"

export default async function DomainOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.publisherId) notFound()

  const domain = await getDomain(id, session.publisherId)
  if (!domain) notFound()

  const gates = await listGatesForDomain(id, session.publisherId)
  const whitelistCount = ((domain.whitelistedPaths ?? []) as string[]).length

  const cards = [
    {
      label:    "Embed script",
      detail:   "Copy + paste the snippet to install OnePaywall on your site.",
      href:     `/domains/${id}/embed`,
      icon:     Code2,
      callout:  domain.embedEnabled ? "Embed is enabled" : "Embed is off",
      tone:     domain.embedEnabled ? "ok" : "muted",
    },
    {
      label:    "Free pages",
      detail:   "URLs that should never trigger a gate (e.g. login, contact).",
      href:     `/domains/${id}/free-pages`,
      icon:     ShieldCheck,
      callout:  whitelistCount === 0 ? "No URLs whitelisted" : `${whitelistCount} URL${whitelistCount === 1 ? "" : "s"} whitelisted`,
      tone:     "muted",
    },
    {
      label:    "Domain settings",
      detail:   "Status, name, and removal.",
      href:     `/domains/${id}/settings`,
      icon:     SettingsIcon,
      callout:  domain.status === "active" ? "Status: active" : `Status: ${domain.status}`,
      tone:     domain.status === "active" ? "ok" : "muted",
    },
  ] as const

  return (
    <div className="flex flex-col gap-6">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Gates configured"   value={gates.length.toString()} />
        <Stat label="Free pages"          value={whitelistCount.toString()} />
        <Stat label="Embed status"        value={domain.embedEnabled ? "On" : "Off"} muted={!domain.embedEnabled} />
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 gap-3">
        {cards.map(c => (
          <Link
            key={c.href}
            href={c.href}
            className="motion-lift group border border-[var(--color-border)] rounded-xl p-4 flex items-center gap-4 hover:border-[var(--color-brand)]"
          >
            <div className="w-9 h-9 rounded-lg bg-[var(--color-brand-subtle)] flex items-center justify-center shrink-0">
              <c.icon size={16} className="text-[var(--color-brand)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-medium text-[var(--color-text)]">{c.label}</p>
              <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">{c.detail}</p>
            </div>
            <span
              className="text-body-sm shrink-0"
              style={{ color: c.tone === "ok" ? "var(--color-brand)" : "var(--color-text-secondary)" }}
            >
              {c.callout}
            </span>
            <ArrowRight size={14} className="shrink-0 text-[var(--color-text-secondary)] group-hover:text-[var(--color-brand)] group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>

      {/* Gates on this domain */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-body font-semibold text-[var(--color-text)]">Gates on this domain</h2>
          <Link href="/gates" className="text-body-sm text-[var(--color-text-secondary)] hover:text-[var(--color-brand)]">Manage all gates →</Link>
        </div>
        {gates.length === 0 ? (
          <div className="border border-dashed border-[var(--color-border)] rounded-xl p-8 text-center text-body-sm text-[var(--color-text-secondary)]">
            No gates yet. Create one from the Gates section.
          </div>
        ) : (
          <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
            {gates.map((g, i) => (
              <Link
                key={g.id}
                href={`/gates/${g.id}`}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-[var(--muted)] transition-colors ${i < gates.length - 1 ? "border-b border-[var(--color-border)]" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium text-[var(--color-text)] truncate">{g.name}</p>
                  <p className="text-label text-[var(--color-text-secondary)]">Priority {g.priority} · {g.enabled ? "Enabled" : "Paused"}</p>
                </div>
                <ArrowRight size={13} className="shrink-0 text-[var(--color-text-secondary)]" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="border border-[var(--color-border)] rounded-xl p-4">
      <div className="text-label uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">{label}</div>
      <div className="text-h2 font-semibold" style={{ color: muted ? "var(--color-text-secondary)" : "var(--color-text)" }}>
        {value}
      </div>
    </div>
  )
}
