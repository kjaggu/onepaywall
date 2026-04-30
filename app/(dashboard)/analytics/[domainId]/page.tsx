import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink, Users } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { getDomain } from "@/lib/db/queries/domains"
import { getSummary, getGateBreakdown, getDailySeries } from "@/lib/db/queries/analytics"
import { getRevenueForPeriod } from "@/lib/db/queries/transactions"
import { getAudienceStats, getIntentTierDistribution, TIER_META, fmtReadTime } from "@/lib/db/queries/reader-intelligence"
import { refreshRollups } from "@/lib/analytics/rollup"
import { AnalyticsChart } from "@/components/dashboard/analytics/analytics-chart"
import { RangeFilter } from "@/components/dashboard/analytics/range-filter"
import { GateFilter } from "@/components/dashboard/analytics/gate-filter"

function fmtMoney(amountInPaise: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amountInPaise / 100)
}

const VALID_RANGES = [7, 30, 90]

function since(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function DomainAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ domainId: string }>
  searchParams: Promise<{ range?: string; gate?: string }>
}) {
  const { domainId } = await params
  const { range: rangeParam, gate: gateParam } = await searchParams
  const days = VALID_RANGES.includes(Number(rangeParam)) ? Number(rangeParam) : 30

  const session = await getSession()
  if (!session?.publisherId) notFound()

  const domain = await getDomain(domainId, session.publisherId)
  if (!domain) notFound()

  const from = since(days)
  await refreshRollups([domainId], from)

  const [summary, gateStats, daily, revenue, audience, tiers] = await Promise.all([
    getSummary([domainId], from),
    getGateBreakdown(domainId, from),
    getDailySeries([domainId], from, gateParam || undefined),
    getRevenueForPeriod(session.publisherId, from, domainId),
    getAudienceStats([domainId], from),
    getIntentTierDistribution([domainId], from),
  ])

  // Validate gateParam is actually one of this domain's gates
  const activeGate = gateParam
    ? (gateStats.find(g => g.gateId === gateParam) ?? null)
    : null

  const hasData = summary.impressions > 0
  const hasRevenue = revenue.total > 0

  const statCards = [
    { label: "Conversion rate", value: hasData ? `${summary.conversionRate}%` : "—" },
    { label: "Unique readers",  value: hasData ? summary.uniqueReaders.toLocaleString() : "—" },
    { label: "Impressions",     value: hasData ? summary.impressions.toLocaleString() : "—" },
    {
      label: "Revenue",
      value: hasRevenue ? fmtMoney(revenue.total, revenue.currency) : "—",
      muted: !hasRevenue,
    },
  ]

  return (
    <div style={{ padding: "28px 32px" }}>
      {/* Back nav */}
      <Link
        href={`/analytics?range=${days}`}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#aaa", marginBottom: 20, textDecoration: "none" }}
      >
        <ArrowLeft size={13} />
        All domains
      </Link>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111", margin: 0 }}>{domain.name}</h1>
            <a
              href={`https://${domain.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, color: "#bbb", textDecoration: "none" }}
            >
              {domain.domain} <ExternalLink size={11} />
            </a>
          </div>
          <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>Gate performance — last {days} days.</p>
        </div>
        <RangeFilter current={days} />
      </div>

      {/* Summary stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        {statCards.map((s, i) => (
          <div key={s.label} style={{ padding: "15px 20px", borderRight: i < statCards.length - 1 ? "1px solid #ebebeb" : "none", background: "#fff" }}>
            <div style={{ fontSize: 11, color: "#aaa", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
              {s.label} <span style={{ color: "#ccc", fontWeight: 400 }}>({days}d)</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: s.muted ? "#ddd" : "#111", letterSpacing: "-0.02em" }}>
              {s.value}
            </div>
            {s.muted && s.label === "Revenue" && (
              <div style={{ fontSize: 10, color: "#ccc", marginTop: 3 }}>No payments in this period</div>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111", whiteSpace: "nowrap" }}>
              Gate events — last {days} days
            </span>
            {activeGate && (
              <span style={{ fontSize: 11, color: "#27adb0", background: "#f0fafa", border: "1px solid #c8eced", borderRadius: 4, padding: "2px 8px" }}>
                {activeGate.gateName}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 16 }}>
              {[{ color: "#27adb0", label: "Impressions" }, { color: "#22c55e", label: "Gate passes" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                  <span style={{ fontSize: 11, color: "#888" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gate filter pills — only shown when domain has multiple gates */}
        {gateStats.length >= 2 && (
          <div style={{ padding: "10px 18px", borderBottom: "1px solid #ebebeb", background: "#fafafa" }}>
            <GateFilter
              gates={gateStats.map(g => ({ gateId: g.gateId, gateName: g.gateName }))}
              current={activeGate?.gateId ?? null}
            />
          </div>
        )}

        <div style={{ padding: "16px 8px 8px" }}>
          <AnalyticsChart data={daily} days={days} />
        </div>
      </div>

      {/* Subscriber composition */}
      {audience.totalReaders > 0 && (
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={14} color="#888" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Reader composition</span>
          </div>

          {/* Subscriber vs Visitor two-column */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #ebebeb" }}>
            <div style={{ padding: "16px 20px", borderRight: "1px solid #ebebeb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#27adb0" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>Subscribers</span>
                <span style={{ fontSize: 11, color: "#aaa", marginLeft: "auto" }}>{audience.subscriberPageviews.toLocaleString()} PVs</span>
              </div>
              <div style={{ display: "flex", gap: 20 }}>
                <SmallMetric label="Readers" value={audience.subscriberReaders.toLocaleString()} />
                <SmallMetric label="Avg read time" value={fmtReadTime(audience.subscriberAvgReadTime)} />
                <SmallMetric label="Avg scroll" value={audience.subscriberAvgScroll != null ? `${audience.subscriberAvgScroll}%` : "—"} />
              </div>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e5e7eb" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>Visitors</span>
                <span style={{ fontSize: 11, color: "#aaa", marginLeft: "auto" }}>{audience.visitorPageviews.toLocaleString()} PVs</span>
              </div>
              <div style={{ display: "flex", gap: 20 }}>
                <SmallMetric label="Readers" value={audience.visitorReaders.toLocaleString()} />
                <SmallMetric label="Avg read time" value={fmtReadTime(audience.visitorAvgReadTime)} />
                <SmallMetric label="Avg scroll" value={audience.visitorAvgScroll != null ? `${audience.visitorAvgScroll}%` : "—"} />
                <SmallMetric
                  label="Gate exposed"
                  value={`${audience.gateExposureRatePct}%`}
                  highlight={audience.gateExposureRatePct > 0}
                  sub={`${audience.conversionOpportunity.toLocaleString()} readers`}
                />
              </div>
            </div>
          </div>

          {/* Intent tiers inline */}
          <div style={{ display: "flex", gap: 0 }}>
            {tiers.filter(t => t.readerCount > 0).map((t, i, arr) => (
              <div
                key={t.tier}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRight: i < arr.length - 1 ? "1px solid #f5f5f5" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: TIER_META[t.tier].color }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#555" }}>{t.label}</span>
                  <span style={{ fontSize: 11, color: "#bbb", marginLeft: "auto" }}>{t.pct}%</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>{t.readerCount.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: "#ccc", marginTop: 1 }}>
                  {t.avgScrollDepth != null ? `${t.avgScrollDepth}% scroll` : ""}
                  {t.avgScrollDepth != null && t.avgReadTimeSeconds != null ? " · " : ""}
                  {t.avgReadTimeSeconds != null ? fmtReadTime(t.avgReadTimeSeconds) : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-gate breakdown */}
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>By gate</span>
          <Link href={`/gates`} style={{ fontSize: 12, color: "#aaa", textDecoration: "none" }}>Manage gates →</Link>
        </div>

        {/* Table head */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px 120px 110px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
          {["Gate", "Impressions", "Gate passes", "Conversion", "Readers"].map((h, i) => (
            <div key={i} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>

        {gateStats.length === 0 ? (
          <div style={{ padding: "32px 18px", textAlign: "center", fontSize: 13, color: "#ccc" }}>
            No gate activity on this domain in the last {days} days.
          </div>
        ) : (
          gateStats.map((gs, i) => (
            <div
              key={gs.gateId}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 110px 110px 120px 110px",
                padding: "11px 18px",
                borderBottom: i < gateStats.length - 1 ? "1px solid #f5f5f5" : "none",
                alignItems: "center",
                background: activeGate?.gateId === gs.gateId ? "#fafffe" : "#fff",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{gs.gateName}</div>
                <Link
                  href={`/gates/${gs.gateId}`}
                  style={{ fontSize: 11, color: "#bbb", textDecoration: "none" }}
                >
                  Edit gate →
                </Link>
              </div>
              <span style={{ fontSize: 13, color: "#333" }}>{gs.impressions.toLocaleString()}</span>
              <span style={{ fontSize: 13, color: "#333" }}>{gs.gatePasses.toLocaleString()}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{gs.conversionRate}%</span>
                <div style={{ flex: 1, height: 3, background: "#f0f0f0", borderRadius: 99, maxWidth: 48 }}>
                  <div style={{ height: "100%", width: `${gs.conversionRate}%`, background: "#27adb0", borderRadius: 99 }} />
                </div>
              </div>
              <span style={{ fontSize: 13, color: "#333" }}>{gs.uniqueReaders.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function SmallMetric({ label, value, sub, highlight }: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: highlight ? "#27adb0" : "#111" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#ccc", marginTop: 1 }}>{sub}</div>}
    </div>
  )
}
