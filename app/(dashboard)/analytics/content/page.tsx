import { FileText, Radio, TrendingDown } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { listDomains } from "@/lib/db/queries/domains"
import { refreshSourceStats } from "@/lib/analytics/source-stats"
import {
  getTopContent,
  getSourceAttribution,
  getReaderJourneyFunnel,
  getActiveReaderCount,
  type ContentRow,
  type SourceRow,
  type FunnelRow,
} from "@/lib/db/queries/content-analytics"
import { fmtReadTime } from "@/lib/db/queries/reader-intelligence"
import { RangeFilter } from "@/components/dashboard/analytics/range-filter"
import { extractPath } from "@/lib/intelligence/sanitize"

const VALID_RANGES = [7, 30, 90]

function since(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function ContentAnalyticsPage({
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

  // Refresh source stats rollup then fetch all data in parallel
  await refreshSourceStats(domainIds, from)

  const [topContent, sources, funnel, activeCount] = await Promise.all([
    getTopContent(domainIds, from, 20),
    getSourceAttribution(domainIds, from),
    getReaderJourneyFunnel(domainIds, from),
    getActiveReaderCount(domainIds),
  ])

  const hasContent = topContent.length > 0

  return (
    <div style={{ padding: "28px 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111", margin: 0 }}>Content Analytics</h1>
          <p style={{ fontSize: 12, color: "#aaa", marginTop: 2, marginBottom: 0 }}>
            Page views, reading depth, source quality — last {days} days.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ActiveChip count={activeCount} />
          <RangeFilter current={days} />
        </div>
      </div>

      {/* Reader journey funnel */}
      <FunnelSection funnel={funnel} />

      {/* Top content table */}
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", gap: 8 }}>
          <FileText size={14} color="#888" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Top content</span>
          <span style={{ fontSize: 11, color: "#bbb", marginLeft: 4 }}>— by page views</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px 80px 80px 90px 90px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
          {["URL", "Category", "Views", "Readers", "Avg read", "Avg scroll", "Gate CVR"].map((h, i) => (
            <div key={i} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>

        {!hasContent ? (
          <div style={{ padding: "40px 32px", textAlign: "center" }}>
            <FileText size={32} color="#ddd" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13, color: "#999" }}>
              Content data appears here once your embed fires <code>page_view</code> events.
            </div>
            <div style={{ fontSize: 12, color: "#bbb", marginTop: 4 }}>Make sure your embed script is installed and the latest version is deployed.</div>
          </div>
        ) : (
          topContent.map((row, i) => (
            <ContentRow key={row.url} row={row} isLast={i === topContent.length - 1} />
          ))
        )}
      </div>

      {/* Source attribution */}
      <SourceSection sources={sources} />
    </div>
  )
}

function ActiveChip({ count }: { count: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "#f0fafa", border: "1px solid #c8eced", borderRadius: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#27adb0", display: "inline-block", flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 500, color: "#13777a", whiteSpace: "nowrap" }}>
        {count.toLocaleString()} active now
      </span>
    </div>
  )
}

function FunnelSection({ funnel }: { funnel: FunnelRow[] }) {
  if (funnel.length === 0 || funnel[0].count === 0) {
    return (
      <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingDown size={14} color="#888" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Reader journey</span>
        </div>
        <div style={{ padding: "32px 18px", textAlign: "center", fontSize: 13, color: "#ccc" }}>
          Funnel data appears once readers start being tracked.
        </div>
      </div>
    )
  }

  return (
    <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden", marginBottom: 14 }}>
      <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", gap: 8 }}>
        <TrendingDown size={14} color="#888" />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Reader journey</span>
        <span style={{ fontSize: 11, color: "#aaa", marginLeft: 4 }}>— new → repeat → gate shown → converted</span>
      </div>
      <div style={{ display: "flex", padding: "20px 24px", gap: 0, alignItems: "center" }}>
        {funnel.map((stage, i) => (
          <div key={stage.stage} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div style={{
              flex: 1,
              padding: "14px 16px",
              background: i === funnel.length - 1 ? "#f0fafa" : "#fafafa",
              borderRadius: 8,
              border: i === funnel.length - 1 ? "1px solid #c8eced" : "1px solid #ebebeb",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 11, color: "#bbb", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                {stage.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: i === funnel.length - 1 ? "#13777a" : "#111", letterSpacing: "-0.02em" }}>
                {stage.count.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: "#bbb", marginTop: 3 }}>
                {stage.pct}% of readers
              </div>
            </div>
            {i < funnel.length - 1 && (
              <div style={{ padding: "0 8px", color: "#ddd", fontSize: 18, flexShrink: 0 }}>→</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ContentRow({ row, isLast }: { row: ContentRow; isLast: boolean }) {
  const path = extractPath(row.url)
  const displayPath = path.length > 48 ? path.slice(0, 48) + "…" : path
  const cvrColor = row.gateConversionRate >= 20 ? "#27adb0" : row.gateConversionRate >= 5 ? "#f59e0b" : "#999"

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 90px 80px 80px 80px 90px 90px",
      padding: "10px 18px",
      borderBottom: isLast ? "none" : "1px solid #f5f5f5",
      alignItems: "center",
      background: "#fff",
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#111", fontFamily: "monospace" }} title={row.url}>
          {displayPath}
        </div>
      </div>
      <div>
        {row.contentCategory ? (
          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", background: "#f5f5f5", color: "#666", borderRadius: 4, textTransform: "capitalize" }}>
            {row.contentCategory}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: "#ddd" }}>—</span>
        )}
      </div>
      <span style={{ fontSize: 13, color: "#333" }}>{row.pageViews.toLocaleString()}</span>
      <span style={{ fontSize: 13, color: "#333" }}>{row.uniqueReaders.toLocaleString()}</span>
      <span style={{ fontSize: 13, color: "#333" }}>{fmtReadTime(row.avgReadTimeSeconds)}</span>
      <span style={{ fontSize: 13, color: "#333" }}>{row.avgScrollDepthPct != null ? `${row.avgScrollDepthPct}%` : "—"}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: cvrColor }}>{row.gateConversionRate}%</span>
        <div style={{ flex: 1, height: 3, background: "#f0f0f0", borderRadius: 99, maxWidth: 32 }}>
          <div style={{ height: "100%", width: `${Math.min(row.gateConversionRate, 100)}%`, background: cvrColor, borderRadius: 99 }} />
        </div>
      </div>
    </div>
  )
}

function SourceSection({ sources }: { sources: SourceRow[] }) {
  // Put 'direct' first, then sort by page views
  const sorted = [
    ...sources.filter(s => s.referrer === "direct"),
    ...sources.filter(s => s.referrer !== "direct").sort((a, b) => b.pageViews - a.pageViews),
  ]

  const maxViews = sorted[0]?.pageViews ?? 1

  return (
    <div style={{ border: "1px solid #ebebeb", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "12px 18px", borderBottom: "1px solid #ebebeb", display: "flex", alignItems: "center", gap: 8 }}>
        <Radio size={14} color="#888" />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Source attribution</span>
        <span style={{ fontSize: 11, color: "#aaa", marginLeft: 4 }}>— referrer quality by reader intent</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 80px 80px 100px", padding: "7px 18px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
        {["Source", "Share", "Views", "Readers", "Avg read", "Quality score"].map((h, i) => (
          <div key={i} style={{ fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</div>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div style={{ padding: "32px 18px", textAlign: "center", fontSize: 13, color: "#ccc" }}>
          Source data appears once page visit signals are being collected.
        </div>
      ) : (
        sorted.map((row, i) => {
          const qualityColor =
            row.readerQualityScore == null ? "#ddd"
            : row.readerQualityScore >= 0.6 ? "#27adb0"
            : row.readerQualityScore >= 0.3 ? "#f59e0b"
            : "#e5e7eb"
          const qualityScore = row.readerQualityScore != null
            ? Math.round(row.readerQualityScore * 100)
            : null
          const label = row.referrer === "direct"
            ? "Direct / None"
            : (() => { try { return new URL(row.referrer).hostname } catch { return row.referrer } })()

          return (
            <div
              key={row.referrer}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 80px 80px 80px 100px",
                padding: "11px 18px",
                borderBottom: i < sorted.length - 1 ? "1px solid #f5f5f5" : "none",
                alignItems: "center",
                background: "#fff",
              }}
            >
              <span style={{ fontSize: 13, color: "#333", fontWeight: row.referrer === "direct" ? 500 : 400 }}>{label}</span>
              <div style={{ paddingRight: 16 }}>
                <div style={{ height: 5, background: "#f3f4f6", borderRadius: 99 }}>
                  <div style={{ height: "100%", width: `${(row.pageViews / maxViews) * 100}%`, background: "#27adb0", borderRadius: 99, minWidth: row.pageViews > 0 ? 4 : 0 }} />
                </div>
              </div>
              <span style={{ fontSize: 13, color: "#333" }}>{row.pageViews.toLocaleString()}</span>
              <span style={{ fontSize: 13, color: "#333" }}>{row.uniqueReaders.toLocaleString()}</span>
              <span style={{ fontSize: 13, color: "#333" }}>{fmtReadTime(row.avgReadTimeSeconds)}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 28, height: 5, background: "#f3f4f6", borderRadius: 99 }}>
                  <div style={{ height: "100%", width: `${qualityScore ?? 0}%`, background: qualityColor, borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 12, color: qualityColor, fontWeight: 500 }}>
                  {qualityScore != null ? `${qualityScore}` : "—"}
                </span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
