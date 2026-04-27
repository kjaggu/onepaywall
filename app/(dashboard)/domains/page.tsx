import { Globe, ExternalLink } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { listDomains } from "@/lib/db/queries/domains"
import { Badge } from "@/components/ui/badge"
import { AddDomainSheet } from "@/components/dashboard/domains/add-domain-sheet"
import { CopySiteKey } from "@/components/dashboard/domains/copy-site-key"
import { DomainActions } from "@/components/dashboard/domains/domain-actions"

export default async function DomainsPage() {
  const session = await getSession()
  const domains = session?.publisherId ? await listDomains(session.publisherId) : []

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h1 text-[var(--color-text)]">Domains</h1>
          <p className="text-body-sm text-[var(--color-text-secondary)] mt-1">
            Manage domains and their payment gates.
          </p>
        </div>
        <AddDomainSheet />
      </div>

      {domains.length === 0 ? (
        /* Empty state */
        <div className="border border-[var(--border)] rounded-lg flex flex-col items-center justify-center py-20 text-center">
          <Globe size={36} className="text-[var(--border)] mb-3" />
          <p className="text-body font-medium text-[var(--color-text-secondary)]">No domains yet</p>
          <p className="text-body-sm text-[var(--muted-foreground)] max-w-xs mt-1 mb-5">
            Add your first domain to generate a site key and start configuring payment gates.
          </p>
          <AddDomainSheet />
        </div>
      ) : (
        /* Domain list */
        <div className="border border-[var(--border)] rounded-lg overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 px-4 py-2.5 bg-[var(--muted)] border-b border-[var(--border)]">
            <span className="text-label text-[var(--muted-foreground)]">Name / Domain</span>
            <span className="text-label text-[var(--muted-foreground)]">Site key</span>
            <span className="text-label text-[var(--muted-foreground)]">Status</span>
            <span className="text-label text-[var(--muted-foreground)]">Embed</span>
            <span />
          </div>

          {/* Rows */}
          {domains.map((d, i) => (
            <div
              key={d.id}
              className={`grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 px-4 py-3 items-center ${
                i < domains.length - 1 ? "border-b border-[var(--border)]" : ""
              }`}
            >
              {/* Name + domain */}
              <div className="min-w-0">
                <p className="text-body font-medium text-[var(--color-text)] truncate">{d.name}</p>
                <a
                  href={`https://${d.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-body-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] truncate w-fit"
                >
                  {d.domain}
                  <ExternalLink size={11} className="shrink-0" />
                </a>
              </div>

              {/* Site key */}
              <CopySiteKey siteKey={d.siteKey} />

              {/* Status */}
              <Badge
                variant={d.status === "active" ? "default" : "secondary"}
                className="w-fit capitalize"
              >
                {d.status}
              </Badge>

              {/* Embed */}
              <Badge
                variant={d.embedEnabled ? "default" : "outline"}
                className="w-fit"
              >
                {d.embedEnabled ? "On" : "Off"}
              </Badge>

              {/* Actions */}
              <DomainActions id={d.id} status={d.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
