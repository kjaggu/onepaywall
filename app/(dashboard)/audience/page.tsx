import { Users, TrendingUp, Zap, PieChart, BarChart2 } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { listDomains } from "@/lib/db/queries/domains"
import { getAudienceStats, getIntentTierDistribution, TIER_META, fmtReadTime } from "@/lib/db/queries/reader-intelligence"
import {
  getSegmentDistribution,
  getTopicInterestDistribution,
  getMonetizationHistogram,
  getVisitFrequencyBreakdown,
  getActiveReaderCount,
} from "@/lib/db/queries/content-analytics"
import { RangeFilter } from "@/components/dashboard/analytics/range-filter"

const VALID_RANGES = [7, 30, 90]

function since(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

const SEGMENT_META: Record<string, { label: string; color: string; description: string }> = {
  new:        { label: "New",        color: "#e5e7eb", description: "≤ 2 visits" },
  casual:     { label: "Casual",     color: "#fbbf24", description: "Low engagement, few visits" },
  regular:    { label: "Regular",    color: "#60a5fa", description: "6+ visits, moderate engagement" },
  power_user: { label: "Power user", color: "#27adb0", description: "20+ visits or high intent" },
}

const FREQ_META: Record<string, { label: string; color: string }> = {
  daily:      { label: "Daily",      color: "#27adb0" },
  weekly:     { label: "Weekly",     color: "#60a5fa" },
  occasional: { label: "Occasional", color: "#fbbf24" },
  one_time:   { label: "One-time",   color: "#e5e7eb" },
  unknown:    { label: "Unknown",    color: "#f3f4f6" },
}

export default async function AudiencePage({
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

  const [stats, tiers, segments, topics, histogram, frequencies, activeCount] = await Promise.all([
    getAudienceStats(domainIds, from),
    getIntentTierDistribution(domainIds, from),
    getSegmentDistribution(domainIds, from),
    getTopicInterestDistribution(domainIds, from),
    getMonetizationHistogram(domainIds, from),
    getVisitFrequencyBreakdown(domainIds, from),
    getActiveReaderCount(domainIds),
  ])

  const hasData = stats.totalReaders > 0
  const totalTierReaders = tiers.reduce((s, t) => s + t.readerCount, 0)
  const totalSegmentReaders = segments.reduce((s, r) => s + r.count, 0)
  const maxTopicScore = Math.max(...topics.map(t => t.avgScore), 0.01)
  const maxHistCount = Math.max(...histogram.map(h => h.count), 1)

  const statCards = [
    {
      label: "Total readers",
      value: hasData ? stats.totalReaders.toLocaleString() : "—",
      sub: `in the last ${days}d`,
    },
    {
      label: "Subscribers",
      value: hasData ? stats.subscriberReaders.toLocaleString() : "—",
      sub: hasData && stats.totalReaders > 0
        ? `${Math.round((stats.subscriberReaders / stats.totalReaders) * 100)}% of readers`
        : "paying readers",
    },
    {
      label: "Visitors",
      value: hasData ? stats.visitorReaders.toLocaleString() : "—",
      sub: hasData && stats.totalReaders > 0
        ? `${Math.round((stats.visitorReaders / stats.totalReaders) * 100)}% of readers`
        : "non-paying readers",
    },
    {
      label: "Conversion opportunity",
      value: hasData ? stats.conversionOpportunity.toLocaleString() : "—",
      sub: "visitors who hit a gate",
      highlight: true,
    },
  ]

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111", margin: 0 }}>Audience</h1>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 2, marginBottom: 0 }}>
            Anonymous reader behaviour — no PII. Signals build into segments over time.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {activeCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "#f0fafa", border: "1px solid #c8eced", borderRadius: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#27adb0", display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: "#13777a", whiteSpace: "nowrap" }}>
                {activeCount.toLocaleString()} active now
              </span>
            </div>
          )}
          <RangeFilter current={days} />
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        {statCards.map((s, i) => (
          <div
            key={s.label}
            style={{
              padding: "15px 20px",
              borderRight: i < statCards.length - 1 ? "1px solid #ebebeb" : "none",
              background: s.highlight ? "#fafffe" : "#fff",
            }}
          >
            <div style={{ fontSize: 11, color: "#aaa", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: s.highlight ? "#27adb0" : "#111", letterSpacing: "-0.02em" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: "#bbb", marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Subscriber vs visitor comparison */}
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={14} color="#888" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Reader composition</span>
          {!hasData && <span style={{ fontSize: 11, color: "#bbb", marginLeft: "auto" }}>No data yet</span>}
        </div>

        {!hasData ? (
          <div style={{ padding: "48px 32px", textAlign: "center" }}>
            <Users size={36} color="#ddd" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13, color: "#999" }}>
              Subscriber vs visitor data appears here once your embed is live and readers are being tracked.
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ padding: "20px 24px", borderRight: "1px solid #ebebeb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27adb0" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Subscribers</span>
                <span style={{ fontSize: 11, color: "#888", marginLeft: "auto" }}>
                  {stats.subscriberPageviews.toLocaleString()} pageviews
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Metric label="Unique readers" value={stats.subscriberReaders.toLocaleString()} />
                <Metric label="Avg read time" value={fmtReadTime(stats.subscriberAvgReadTime)} />
                <Metric label="Avg scroll depth" value={stats.subscriberAvgScroll != null ? `${stats.subscriberAvgScroll}%` : "—"} />
                <Metric label="Gate exposure" value="0%" sub="subscribers bypass gates" muted />
              </div>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#e5e7eb" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Visitors</span>
                <span style={{ fontSize: 11, color: "#888", marginLeft: "auto" }}>
                  {stats.visitorPageviews.toLocaleString()} pageviews
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Metric label="Unique readers" value={stats.visitorReaders.toLocaleString()} />
                <Metric label="Avg read time" value={fmtReadTime(stats.visitorAvgReadTime)} />
                <Metric label="Avg scroll depth" value={stats.visitorAvgScroll != null ? `${stats.visitorAvgScroll}%` : "—"} />
                <Metric
                  label="Gate exposed"
                  value={`${stats.gateExposureRatePct}%`}
                  sub={`${stats.conversionOpportunity.toLocaleString()} unique readers`}
                  highlight={stats.gateExposureRatePct > 0}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Monetisation intent (existing) */}
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingUp size={14} color="#888" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Monetisation intent</span>
          <span style={{ fontSize: 11, color: "#aaa", marginLeft: 4 }}>— reader intent tiers based on engagement signals</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 90px 90px 90px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
          {["Tier", "Share", "Readers", "Avg scroll", "Avg read time"].map((h, i) => (
            <div key={i} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>

        {totalTierReaders === 0 ? (
          <div style={{ padding: "32px 18px", textAlign: "center", fontSize: 13, color: "#ccc" }}>
            Intent tiers populate once visitor data is tracked with is_subscriber stamps.
          </div>
        ) : (
          tiers.map((tier, i) => (
            <div
              key={tier.tier}
              style={{
                display: "grid",
                gridTemplateColumns: "180px 1fr 90px 90px 90px",
                padding: "12px 18px",
                borderBottom: i < tiers.length - 1 ? "1px solid #f5f5f5" : "none",
                alignItems: "center",
                background: "#fff",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: TIER_META[tier.tier].color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>{tier.label}</span>
                </div>
                <div style={{ fontSize: 11, color: "#bbb", marginTop: 2, paddingLeft: 16 }}>{tier.description}</div>
              </div>
              <div style={{ paddingRight: 24 }}>
                <div style={{ height: 6, background: "#f3f4f6", borderRadius: 99 }}>
                  <div style={{ height: "100%", width: `${tier.pct}%`, background: TIER_META[tier.tier].color, borderRadius: 99, minWidth: tier.pct > 0 ? 4 : 0, transition: "width 0.3s" }} />
                </div>
                <div style={{ fontSize: 10, color: "#bbb", marginTop: 3 }}>{tier.pct}%</div>
              </div>
              <span style={{ fontSize: 13, color: "#333" }}>{tier.readerCount.toLocaleString()}</span>
              <span style={{ fontSize: 13, color: "#333" }}>{tier.avgScrollDepth != null ? `${tier.avgScrollDepth}%` : "—"}</span>
              <span style={{ fontSize: 13, color: "#333" }}>{fmtReadTime(tier.avgReadTimeSeconds)}</span>
            </div>
          ))
        )}
      </div>

      {/* ── NEW: Profile-powered sections ── */}

      {/* Audience segments */}
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", gap: 8 }}>
          <PieChart size={14} color="#888" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Audience segments</span>
          <span style={{ fontSize: 11, color: "#aaa", marginLeft: 4 }}>— computed from reader profiles</span>
        </div>

        {totalSegmentReaders === 0 ? (
          <div style={{ padding: "32px 18px", textAlign: "center", fontSize: 13, color: "#ccc" }}>
            Segment data appears once reader profiles have been computed.
          </div>
        ) : (
          <div style={{ padding: "20px 24px" }}>
            {/* Stacked bar */}
            <div style={{ display: "flex", height: 8, borderRadius: 99, overflow: "hidden", marginBottom: 16, gap: 2 }}>
              {segments.map(s => (
                <div
                  key={s.segment}
                  style={{ flex: s.count, background: SEGMENT_META[s.segment]?.color ?? "#e5e7eb", minWidth: s.pct > 0 ? 4 : 0 }}
                  title={`${SEGMENT_META[s.segment]?.label}: ${s.pct}%`}
                />
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {["new", "casual", "regular", "power_user"].map(seg => {
                const row = segments.find(s => s.segment === seg)
                const meta = SEGMENT_META[seg]
                return (
                  <div key={seg} style={{ padding: "12px 14px", background: "#fafafa", borderRadius: 8, border: "1px solid #f0f0f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, border: "1px solid #e5e7eb", flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#555" }}>{meta.label}</span>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#111", letterSpacing: "-0.02em" }}>
                      {row ? row.count.toLocaleString() : "0"}
                    </div>
                    <div style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>
                      {row ? `${row.pct}%` : "0%"} · {meta.description}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Two-col: topic interests + visit frequency */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>

        {/* Topic interest distribution */}
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", gap: 8 }}>
            <BarChart2 size={14} color="#888" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Topic interests</span>
          </div>
          {topics.length === 0 ? (
            <div style={{ padding: "32px 18px", textAlign: "center", fontSize: 13, color: "#ccc" }}>No topic data yet.</div>
          ) : (
            <div style={{ padding: "12px 18px" }}>
              {topics.slice(0, 10).map((t, i) => (
                <div key={t.category} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < topics.length - 1 ? 8 : 0 }}>
                  <span style={{ fontSize: 11, color: "#555", textTransform: "capitalize", width: 90, flexShrink: 0 }}>{t.category}</span>
                  <div style={{ flex: 1, height: 5, background: "#f3f4f6", borderRadius: 99 }}>
                    <div style={{ height: "100%", width: `${(t.avgScore / maxTopicScore) * 100}%`, background: "#27adb0", borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 11, color: "#888", width: 28, textAlign: "right", flexShrink: 0 }}>
                    {t.readerCount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visit frequency */}
        <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={14} color="#888" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Visit frequency</span>
          </div>
          {frequencies.length === 0 ? (
            <div style={{ padding: "32px 18px", textAlign: "center", fontSize: 13, color: "#ccc" }}>No frequency data yet.</div>
          ) : (
            <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {["daily", "weekly", "occasional", "one_time", "unknown"].map(freq => {
                const row = frequencies.find(f => f.frequency === freq)
                const meta = FREQ_META[freq] ?? { label: freq, color: "#e5e7eb" }
                return (
                  <div key={freq} style={{ padding: "10px 12px", background: "#fafafa", borderRadius: 8, border: "1px solid #f0f0f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#666" }}>{meta.label}</span>
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "#111" }}>{row ? row.count.toLocaleString() : "0"}</div>
                    <div style={{ fontSize: 10, color: "#bbb", marginTop: 1 }}>{row ? `${row.pct}%` : "0%"}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Monetisation probability histogram */}
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", gap: 8 }}>
          <BarChart2 size={14} color="#888" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Monetisation probability</span>
          <span style={{ fontSize: 11, color: "#aaa", marginLeft: 4 }}>— reader distribution by computed conversion likelihood</span>
        </div>

        {histogram.every(h => h.count === 0) ? (
          <div style={{ padding: "32px 18px", textAlign: "center", fontSize: 13, color: "#ccc" }}>
            Histogram populates once reader profiles have been computed.
          </div>
        ) : (
          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
              {histogram.map(h => {
                const heightPct = (h.count / maxHistCount) * 100
                const bucketNum = h.bucketStart / 10
                const barColor = bucketNum >= 7 ? "#27adb0" : bucketNum >= 4 ? "#60a5fa" : "#e5e7eb"
                return (
                  <div key={h.bucketLabel} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: "100%", height: `${heightPct}%`, background: barColor, borderRadius: "3px 3px 0 0", minHeight: h.count > 0 ? 3 : 0 }} title={`${h.bucketLabel}: ${h.count} readers`} />
                  </div>
                )
              })}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {histogram.map(h => (
                <div key={h.bucketLabel} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#bbb" }}>
                  {h.bucketStart}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 8, borderTop: "1px solid #f5f5f5" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 10, background: "#e5e7eb", borderRadius: 2 }} />
                <span style={{ fontSize: 11, color: "#999" }}>Low intent (0–40%)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 10, background: "#60a5fa", borderRadius: 2 }} />
                <span style={{ fontSize: 11, color: "#999" }}>Moderate (40–70%)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 10, background: "#27adb0", borderRadius: 2 }} />
                <span style={{ fontSize: 11, color: "#999" }}>High intent (70%+)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Monetisation signals — what we collect */}
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={14} color="#888" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Monetisation signals</span>
          </div>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>
            All signals are tied to an anonymous fingerprint — never to PII. Raw signals deleted after 90 days.
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
          {SIGNALS.map((s, i) => (
            <div key={s.title} style={{ padding: "16px 20px", borderRight: i < SIGNALS.length - 1 ? "1px solid #f5f5f5" : "none" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#222", marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, sub, muted, highlight }: {
  label: string
  value: string
  sub?: string
  muted?: boolean
  highlight?: boolean
}) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#bbb", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: highlight ? "#27adb0" : muted ? "#d1d5db" : "#111", letterSpacing: "-0.01em" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#ccc", marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

const SIGNALS = [
  {
    title: "Subscription status",
    body:  "Every page visit is stamped as subscriber or visitor at signal time, enabling engagement comparisons across segments.",
  },
  {
    title: "Gate exposure",
    body:  "We track whether a gate was shown on each visit, identifying readers who are in the monetisation funnel but haven't converted.",
  },
  {
    title: "Read time + scroll depth",
    body:  "Collected on every gated view via pagehide signal. Feeds the intent tier model — deeper engagement = higher conversion propensity.",
  },
  {
    title: "Visit frequency",
    body:  "Per-domain visit counts determine whether a reader is habitual. Habitual non-subscribers at high intent are the primary upgrade targets.",
  },
  {
    title: "Referrer source",
    body:  "Origin domain of the referring page (no path). Direct and search traffic shows higher subscription intent than social referrals.",
  },
  {
    title: "Device type",
    body:  "Desktop readers convert at higher rates. Mobile gate exposure informs responsive layout decisions for subscription CTAs.",
  },
]
