import { notFound } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { getDomain } from "@/lib/db/queries/domains"
import { CopySiteKey } from "@/components/dashboard/domains/copy-site-key"
import { DomainStatusActions } from "@/components/dashboard/domains/domain-status-actions"

export default async function DomainSettingsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.publisherId) notFound()

  const domain = await getDomain(id, session.publisherId)
  if (!domain) notFound()

  return (
    <div className="flex flex-col gap-6">
      {/* Identity */}
      <section>
        <h2 className="text-body font-semibold text-[var(--color-text)] mb-3">Identity</h2>
        <div className="border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)]">
          <Row label="Domain name" value={domain.name} />
          <Row label="Host" value={domain.domain} />
          <Row label="Site key">
            <CopySiteKey siteKey={domain.siteKey} />
          </Row>
        </div>
      </section>

      {/* Status & destructive actions */}
      <section>
        <h2 className="text-body font-semibold text-[var(--color-text)] mb-1">Status</h2>
        <p className="text-body-sm text-[var(--color-text-secondary)] mb-3">
          Pausing keeps the domain configured but stops serving gates. Removing is permanent.
        </p>
        <DomainStatusActions id={domain.id} status={domain.status} />
      </section>
    </div>
  )
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <span className="text-body-sm text-[var(--color-text-secondary)] w-32 shrink-0">{label}</span>
      {value !== undefined && <span className="text-body-sm text-[var(--color-text)]">{value}</span>}
      {children}
    </div>
  )
}
