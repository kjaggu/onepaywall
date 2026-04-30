import Link from "next/link"
import { ArrowRight, BarChart2, Users } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { listDomains } from "@/lib/db/queries/domains"
import { getSummary, getDomainBreakdown, getDailySeries } from "@/lib/db/queries/analytics"
import { getRevenueForPeriod } from "@/lib/db/queries/transactions"
import { getAudienceStats, fmtReadTime } from "@/lib/db/queries/reader-intelligence"
import { refreshRollups } from "@/lib/analytics/rollup"
import { AnalyticsChart } from "@/components/dashboard/analytics/analytics-chart"
import { RangeFilter } from "@/components/dashboard/analytics/range-filter"

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

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const { range: rangeParam } = await searchParams
  const days = VALID_RANGES.includes(Number(rangeParam)) ? Number(rangeParam) : 30

  const session = await getSession()
  const domains = session?.publisherId ? await listDomains(session.publisherId) : []
  const domainIds = domains.map(d => d.id)
  const domainMap = Object.fromEntries(domains.map(d => [d.id, d]))
  const from = since(days)

  await refreshRollups(domainIds, from)

  const [summary, domainStats, daily, revenue, audience] = await Promise.all([
    getSummary(domainIds, from),
    getDomainBreakdown(domainIds, from),
    getDailySeries(domainIds, from),
    session?.publisherId
      ? getRevenueForPeriod(session.publisherId, from)
      : Promise.resolve({ total: 0, currency: "INR", count: 0 }),
    getAudienceStats(domainIds, from),
  ])

  const hasData = summary.impressions > 0
  const hasRevenue = revenue.total > 0

  const statCards = [
    { label: "Conversion rate",    value: hasData ? `${summary.conversionRate}%` : "—" },
    { label: `Unique readers`,     value: hasData ? summary.uniqueReaders.toLocaleString() : "—" },
    { label: `Impressions`,        value: hasData ? summary.impressions.toLocaleString() : "—" },
    {
      label: "Revenue",
      value: hasRevenue ? fmtMoney(revenue.total, revenue.currency) : "—",
      muted: !hasRevenue,
    },
  ]

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111", margin: 0 }}>Analytics</h1>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 2, marginBottom: 0 }}>Gate performance, reader behaviour, and revenue.</p>
        </div>
        <RangeFilter current={days} />
      </div>

      {/* Summary stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        {statCards.map((s, i) => (
          <div
            key={s.label}
            style={{ padding: "15px 20px", borderRight: i < statCards.length - 1 ? "1px solid #ebebeb" : "none", background: "#fff" }}
          >
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
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Gate events — last {days} days</span>
          <div style={{ display: "flex", gap: 16 }}>
            {[{ color: "#27adb0", label: "Impressions" }, { color: "#22c55e", label: "Gate passes" }].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                <span style={{ fontSize: 11, color: "#888" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "16px 8px 8px" }}>
          {hasData ? (
            <AnalyticsChart data={daily} days={days} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 32px", textAlign: "center" }}>
              <BarChart2 size={40} stroke="#ddd" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 500, color: "#888", marginBottom: 6 }}>No data yet</div>
              <div style={{ fontSize: 12, color: "#bbb", maxWidth: 320, lineHeight: 1.6 }}>
                Analytics populate once your embed is live and readers start hitting your gates.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subscriber composition strip */}
      {audience.totalReaders > 0 && (
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={14} color="#888" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Reader composition</span>
            <span style={{ fontSize: 11, color: "#aaa", marginLeft: 4 }}>({days}d)</span>
            <Link href="/audience" style={{ fontSize: 12, color: "#aaa", textDecoration: "none", marginLeft: "auto" }}>
              Full audience →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)" }}>
            {[
              { label: "Total readers",     value: audience.totalReaders.toLocaleString() },
              { label: "Subscribers",        value: audience.subscriberReaders.toLocaleString(),
                sub: audience.totalReaders > 0 ? `${Math.round((audience.subscriberReaders / audience.totalReaders) * 100)}% of readers` : undefined },
              { label: "Visitors",           value: audience.visitorReaders.toLocaleString(),
                sub: audience.totalReaders > 0 ? `${Math.round((audience.visitorReaders / audience.totalReaders) * 100)}% of readers` : undefined },
              { label: "Conversion oppty",   value: audience.conversionOpportunity.toLocaleString(),
                sub: "visitors who hit a gate", highlight: true },
              { label: "Gate exposure rate", value: `${audience.gateExposureRatePct}%`,
                sub: "of visitor pageviews" },
            ].map((s, i) => (
              <div key={s.label} style={{ padding: "14px 18px", borderRight: i < 4 ? "1px solid #f5f5f5" : "none" }}>
                <div style={{ fontSize: 10, color: "#bbb", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: s.highlight ? "#27adb0" : "#111", letterSpacing: "-0.02em" }}>{s.value}</div>
                {s.sub && <div style={{ fontSize: 10, color: "#ccc", marginTop: 2 }}>{s.sub}</div>}
              </div>
            ))}
          </div>
          {/* Engagement comparison row */}
          <div style={{ padding: "10px 18px", background: "#fafafa", borderTop: "1px solid #f0f0f0", display: "flex", gap: 32 }}>
            <CompareRow label="Avg read time" subVal={fmtReadTime(audience.visitorAvgReadTime)} subriVal={fmtReadTime(audience.subscriberAvgReadTime)} />
            <CompareRow label="Avg scroll depth"
              subVal={audience.visitorAvgScroll != null ? `${audience.visitorAvgScroll}%` : "—"}
              subriVal={audience.subscriberAvgScroll != null ? `${audience.subscriberAvgScroll}%` : "—"} />
          </div>
        </div>
      )}

      {/* Per-domain breakdown */}
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>By domain</span>
        </div>

        {/* Table head */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 110px 100px 40px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
          {["Domain", "Impressions", "Gate passes", "Conversion", "Readers", ""].map((h, i) => (
            <div key={i} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>

        {domainStats.length === 0 ? (
          <div style={{ padding: "32px 18px", textAlign: "center", fontSize: 13, color: "#ccc" }}>
            No gate activity in the last {days} days.
          </div>
        ) : (
          domainStats.map((ds, i) => {
            const domain = domainMap[ds.domainId]
            return (
              <div
                key={ds.domainId}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 100px 100px 110px 100px 40px",
                  padding: "11px 18px",
                  borderBottom: i < domainStats.length - 1 ? "1px solid #f5f5f5" : "none",
                  alignItems: "center",
                  background: "#fff",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{domain?.name ?? ds.domainId}</div>
                  <div style={{ fontSize: 11, color: "#bbb", marginTop: 1 }}>{domain?.domain ?? ""}</div>
                </div>
                <span style={{ fontSize: 13, color: "#333" }}>{ds.impressions.toLocaleString()}</span>
                <span style={{ fontSize: 13, color: "#333" }}>{ds.gatePasses.toLocaleString()}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{ds.conversionRate}%</span>
                  <div style={{ flex: 1, height: 3, background: "#f0f0f0", borderRadius: 99, maxWidth: 48 }}>
                    <div style={{ height: "100%", width: `${ds.conversionRate}%`, background: "#27adb0", borderRadius: 99 }} />
                  </div>
                </div>
                <span style={{ fontSize: 13, color: "#333" }}>{ds.uniqueReaders.toLocaleString()}</span>
                <Link
                  href={`/analytics/${ds.domainId}?range=${days}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", color: "#ccc" }}
                >
                  <ArrowRight size={14} />
                </Link>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function CompareRow({ label, subVal, subriVal }: { label: string; subVal: string; subriVal: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 11, color: "#aaa", minWidth: 100 }}>{label}</span>
      <span style={{ fontSize: 11, color: "#888" }}>
        <span style={{ color: "#bbb" }}>Visitors</span> {subVal}
      </span>
      <span style={{ fontSize: 11, color: "#bbb" }}>·</span>
      <span style={{ fontSize: 11, color: "#888" }}>
        <span style={{ color: "#27adb0" }}>Subscribers</span> {subriVal}
      </span>
    </div>
  )
}
