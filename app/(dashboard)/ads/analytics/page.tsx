import { BarChart2 } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { listDomains } from "@/lib/db/queries/domains"
import {
  getAdUnitStats,
  getAdSegmentStats,
  getAdCategoryStats,
  getAdAnalyticsSummary,
  type AdUnitStat,
  type AdSegmentStat,
  type AdCategoryStat,
} from "@/lib/db/queries/ad-analytics"
import { RangeFilter } from "@/components/dashboard/analytics/range-filter"

const VALID_RANGES = [7, 30, 90]

function since(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[var(--color-border)] rounded-xl p-5 flex flex-col gap-1">
      <span className="text-body-sm text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-[28px] font-bold text-[var(--color-text)] leading-none">{value}</span>
    </div>
  )
}

function AdUnitTable({ rows }: { rows: AdUnitStat[] }) {
  if (rows.length === 0) return null
  return (
    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] text-left">
            <th className="px-4 py-3 font-medium">Ad Unit</th>
            <th className="px-4 py-3 font-medium text-right">Impressions</th>
            <th className="px-4 py-3 font-medium text-right">Completion %</th>
            <th className="px-4 py-3 font-medium text-right">Skip %</th>
            <th className="px-4 py-3 font-medium text-right">CTA CTR</th>
            <th className="px-4 py-3 font-medium text-right">Fill %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.adUnitId}
              className={i % 2 === 0 ? "bg-[var(--color-surface)]" : "bg-[var(--color-surface-2)]"}
            >
              <td className="px-4 py-3 font-medium text-[var(--color-text)]">{r.adUnitName}</td>
              <td className="px-4 py-3 text-right text-[var(--color-text)]">{r.impressions.toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-[var(--color-text)]">{r.completionRate}%</td>
              <td className="px-4 py-3 text-right text-[var(--color-text)]">{r.skipRate}%</td>
              <td className="px-4 py-3 text-right text-[var(--color-text)]">{r.ctr > 0 ? `${r.ctr}%` : "—"}</td>
              <td className="px-4 py-3 text-right text-[var(--color-text)]">{r.fillRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SegmentTable({ rows }: { rows: AdSegmentStat[] }) {
  if (rows.length === 0) return null
  return (
    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] text-left">
            <th className="px-4 py-3 font-medium">Segment</th>
            <th className="px-4 py-3 font-medium text-right">Impressions</th>
            <th className="px-4 py-3 font-medium text-right">Completion %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.segment}
              className={i % 2 === 0 ? "bg-[var(--color-surface)]" : "bg-[var(--color-surface-2)]"}
            >
              <td className="px-4 py-3 font-medium text-[var(--color-text)] capitalize">{r.segment.replace("_", " ")}</td>
              <td className="px-4 py-3 text-right text-[var(--color-text)]">{r.impressions.toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-[var(--color-text)]">{r.completionRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CategoryTable({ rows }: { rows: AdCategoryStat[] }) {
  if (rows.length === 0) return null
  return (
    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] text-left">
            <th className="px-4 py-3 font-medium">Content Category</th>
            <th className="px-4 py-3 font-medium text-right">Impressions</th>
            <th className="px-4 py-3 font-medium text-right">Completion %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.category}
              className={i % 2 === 0 ? "bg-[var(--color-surface)]" : "bg-[var(--color-surface-2)]"}
            >
              <td className="px-4 py-3 font-medium text-[var(--color-text)] capitalize">{r.category}</td>
              <td className="px-4 py-3 text-right text-[var(--color-text)]">{r.impressions.toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-[var(--color-text)]">{r.completionRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function AdsAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const { range: rangeParam } = await searchParams
  const days = VALID_RANGES.includes(Number(rangeParam)) ? Number(rangeParam) : 30

  const session = await getSession()
  const domains = session?.publisherId ? await listDomains(session.publisherId) : []
  const domainIds = domains.map(d => d.id)
  const from = since(days)

  const [summary, byUnit, bySegment, byCategory] = await Promise.all([
    getAdAnalyticsSummary(domainIds, from),
    getAdUnitStats(domainIds, from),
    getAdSegmentStats(domainIds, from),
    getAdCategoryStats(domainIds, from),
  ])

  const isEmpty = summary.totalImpressions === 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-body-sm text-[var(--color-text-secondary)]">Last {days} days</p>
        <RangeFilter current={days} />
      </div>

      {isEmpty ? (
        <div className="border border-dashed border-[var(--color-border)] rounded-xl p-12 text-center">
          <BarChart2 size={28} className="mx-auto mb-3 text-[var(--color-text-secondary)]" />
          <p className="text-body font-medium text-[var(--color-text)]">No ad events yet</p>
          <p className="text-body-sm text-[var(--color-text-secondary)] mt-1 max-w-md mx-auto">
            Make sure an ad step is configured in a gate and the embed script is installed on your site.
          </p>
        </div>
      ) : (
        <>
          {/* Summary chips */}
          <div className="grid grid-cols-3 gap-4">
            <StatChip label="Total Impressions" value={summary.totalImpressions.toLocaleString()} />
            <StatChip label="Completion Rate" value={`${summary.overallCompletionRate}%`} />
            <StatChip label="Skip Rate" value={`${summary.overallSkipRate}%`} />
          </div>

          {/* By Ad Unit */}
          {byUnit.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-body font-semibold text-[var(--color-text)]">By Ad Unit</h2>
              <AdUnitTable rows={byUnit} />
            </div>
          )}

          {/* By Segment and By Category side by side */}
          <div className="grid grid-cols-2 gap-6">
            {bySegment.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="text-body font-semibold text-[var(--color-text)]">By Reader Segment</h2>
                <SegmentTable rows={bySegment} />
              </div>
            )}
            {byCategory.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="text-body font-semibold text-[var(--color-text)]">By Content Category</h2>
                <CategoryTable rows={byCategory} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
