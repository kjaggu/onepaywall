import Link from "next/link"
import { AlertTriangle, Briefcase, CheckCircle2, Globe } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { getBrandsSummary } from "@/lib/db/queries/brands"
import { getPublisherReaderPlan } from "@/lib/db/queries/publisher-plans"
import { getPgConfig } from "@/lib/db/queries/pg-configs"
import { listDomains } from "@/lib/db/queries/domains"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type BrandHealth = {
  pgConfigured: boolean
  pricingSet: boolean
  domainVerified: boolean
}

async function getBrandHealth(brandId: string, publisherId: string): Promise<BrandHealth> {
  const [plan, pgConfig, domains] = await Promise.all([
    getPublisherReaderPlan(brandId),
    getPgConfig(brandId),
    listDomains(publisherId, brandId),
  ])

  const pgConfigured = !!pgConfig && (
    pgConfig.mode === "platform" ||
    (pgConfig.mode === "own" && !!pgConfig.keyId && !!pgConfig.keySecret)
  )

  const pricingSet = !!(
    plan && (plan.unlockEnabled || plan.subsEnabled) && (
      (plan.defaultUnlockPrice && plan.defaultUnlockPrice > 0) ||
      (plan.monthlyPrice && plan.monthlyPrice > 0) ||
      (plan.quarterlyPrice && plan.quarterlyPrice > 0) ||
      (plan.annualPrice && plan.annualPrice > 0)
    )
  )

  const domainVerified = domains.some(d => d.embedEnabled && d.status === "active" && !d.deletedAt)

  return { pgConfigured, pricingSet, domainVerified }
}

export default async function BrandsPage() {
  const session = await getSession()
  if (!session?.publisherId) return null

  const brands = await getBrandsSummary(session.publisherId)

  const brandHealthList = await Promise.all(
    brands.map(b => getBrandHealth(b.id, session.publisherId!).then(h => ({ ...b, health: h })))
  )

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h1 text-[var(--color-text)]">Brands</h1>
          <p className="text-body-sm text-[var(--color-text-secondary)] mt-1">
            Each brand can have up to 3 domains. Readers subscribe to a brand.
          </p>
        </div>
      </div>

      {brandHealthList.length === 0 ? (
        <div className="border border-[var(--border)] rounded-lg flex flex-col items-center justify-center py-20 text-center">
          <Briefcase size={36} className="text-[var(--border)] mb-3" />
          <p className="text-body font-medium text-[var(--color-text-secondary)]">No brands yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {brandHealthList.map(brand => {
            const issues: { label: string; href: string }[] = []
            if (!brand.health.pgConfigured) {
              issues.push({ label: "Payment gateway not configured", href: "/settings/payment-gateway" })
            }
            if (!brand.health.pricingSet) {
              issues.push({ label: "Pricing not set", href: "/pricing" })
            }
            if (!brand.health.domainVerified) {
              issues.push({ label: "No verified domain", href: "/domains" })
            }

            const healthy = issues.length === 0

            return (
              <div
                key={brand.id}
                className="border border-[var(--border)] rounded-xl p-5"
              >
                {/* Brand header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[var(--color-brand-subtle)] flex items-center justify-center shrink-0">
                      <Briefcase size={16} className="text-[var(--color-brand)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-body font-semibold text-[var(--color-text)] truncate">{brand.name}</p>
                      <p className="text-body-sm text-[var(--color-text-secondary)]">{brand.slug}</p>
                    </div>
                  </div>

                  {healthy ? (
                    <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5 text-body-sm text-[var(--color-text-secondary)]">
                    <Globe size={13} />
                    <span>{brand.domainCount} domain{brand.domainCount !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-body-sm text-[var(--color-text-secondary)]">
                    <Badge variant="outline" className="h-5 px-1.5 text-[11px]">
                      {brand.activeSubscriberCount} active subscriber{brand.activeSubscriberCount !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>

                {/* Issues */}
                {issues.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-col gap-2">
                    {issues.map(issue => (
                      <div key={issue.href} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-body-sm text-amber-600">
                          <AlertTriangle size={13} />
                          <span>{issue.label}</span>
                        </div>
                        <Link href={issue.href}>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            Fix
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
