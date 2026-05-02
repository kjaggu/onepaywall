import { and, eq, gte, inArray, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import {
  gateEvents,
  pageEvents,
  readerPageVisits,
  readerProfiles,
  readerTokens,
  sourceStats,
} from "@/lib/db/schema"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pageEventsDomainFilter(domainIds: string[]) {
  return domainIds.length === 1
    ? eq(pageEvents.domainId, domainIds[0])
    : inArray(pageEvents.domainId, domainIds)
}

function visitsDomainFilter(domainIds: string[]) {
  return domainIds.length === 1
    ? eq(readerPageVisits.domainId, domainIds[0])
    : inArray(readerPageVisits.domainId, domainIds)
}

function gateEventsDomainFilter(domainIds: string[]) {
  return domainIds.length === 1
    ? eq(gateEvents.domainId, domainIds[0])
    : inArray(gateEvents.domainId, domainIds)
}

function tokensDomainFilter(domainIds: string[]) {
  return domainIds.length === 1
    ? eq(readerTokens.domainId, domainIds[0])
    : inArray(readerTokens.domainId, domainIds)
}

// ─── Content analytics ────────────────────────────────────────────────────────

export type ContentRow = {
  url: string
  contentCategory: string | null
  pageViews: number
  uniqueReaders: number
  avgReadTimeSeconds: number | null
  avgScrollDepthPct: number | null
  gateShownReaders: number
  gatePassedReaders: number
  gateConversionRate: number
}

// Top content by page views for the given domains + time window.
// Gate conversion rate: readers who passed a gate on this URL / readers who saw a gate on this URL.
export async function getTopContent(
  domainIds: string[],
  since: Date,
  limit = 20,
): Promise<ContentRow[]> {
  if (domainIds.length === 0) return []

  // Page view metrics from page_events
  const pvRows = await db
    .select({
      url:                pageEvents.url,
      contentCategory:    pageEvents.contentCategory,
      pageViews:          sql<number>`COUNT(*) FILTER (WHERE ${pageEvents.eventType} = 'page_view')`,
      uniqueReaders:      sql<number>`COUNT(DISTINCT ${pageEvents.readerId})`,
      avgReadTimeSeconds: sql<number | null>`ROUND(AVG(${pageEvents.readTimeSeconds}) FILTER (WHERE ${pageEvents.eventType} = 'read_complete'))`,
      avgScrollDepthPct:  sql<number | null>`ROUND(AVG(${pageEvents.scrollDepthPct}) FILTER (WHERE ${pageEvents.eventType} = 'read_complete'))`,
    })
    .from(pageEvents)
    .where(and(pageEventsDomainFilter(domainIds), gte(pageEvents.occurredAt, since)))
    .groupBy(pageEvents.url, pageEvents.contentCategory)
    .orderBy(sql`COUNT(*) FILTER (WHERE ${pageEvents.eventType} = 'page_view') DESC`)
    .limit(limit)

  if (pvRows.length === 0) return []

  const urls = pvRows.map(r => r.url)

  // Gate shown/passed from reader_page_visits (has gateShown flag + url) + gate_events (gate_passed)
  const gateRows = await db
    .select({
      url:               readerPageVisits.url,
      gateShownReaders:  sql<number>`COUNT(DISTINCT ${readerPageVisits.readerId}) FILTER (WHERE ${readerPageVisits.gateShown} = true)`,
    })
    .from(readerPageVisits)
    .where(and(
      visitsDomainFilter(domainIds),
      gte(readerPageVisits.occurredAt, since),
      inArray(readerPageVisits.url, urls),
    ))
    .groupBy(readerPageVisits.url)

  const passedRows = await db
    .select({
      contentId:          gateEvents.contentId,
      gatePassedReaders:  sql<number>`COUNT(DISTINCT ${gateEvents.readerId})`,
    })
    .from(gateEvents)
    .where(and(
      gateEventsDomainFilter(domainIds),
      gte(gateEvents.occurredAt, since),
      eq(gateEvents.eventType, "gate_passed"),
    ))
    .groupBy(gateEvents.contentId)

  const gateByUrl = new Map(gateRows.map(r => [r.url, Number(r.gateShownReaders)]))
  const passedByUrl = new Map(passedRows.map(r => [r.contentId, Number(r.gatePassedReaders)]))

  return pvRows.map(r => {
    const shown  = gateByUrl.get(r.url) ?? 0
    const passed = passedByUrl.get(r.url) ?? 0
    return {
      url:                r.url,
      contentCategory:    r.contentCategory ?? null,
      pageViews:          Number(r.pageViews),
      uniqueReaders:      Number(r.uniqueReaders),
      avgReadTimeSeconds: r.avgReadTimeSeconds != null ? Number(r.avgReadTimeSeconds) : null,
      avgScrollDepthPct:  r.avgScrollDepthPct  != null ? Number(r.avgScrollDepthPct)  : null,
      gateShownReaders:   shown,
      gatePassedReaders:  passed,
      gateConversionRate: shown > 0 ? Math.round((passed / shown) * 100) : 0,
    }
  })
}

// ─── Source attribution ───────────────────────────────────────────────────────

export type SourceRow = {
  referrer: string
  pageViews: number
  uniqueReaders: number
  avgReadTimeSeconds: number | null
  avgScrollDepthPct: number | null
  readerQualityScore: number | null
}

// Reads from the source_stats rollup (must be refreshed before calling).
export async function getSourceAttribution(
  domainIds: string[],
  since: Date,
): Promise<SourceRow[]> {
  if (domainIds.length === 0) return []

  const sinceDate = since.toISOString().slice(0, 10)

  const domainFilter =
    domainIds.length === 1
      ? eq(sourceStats.domainId, domainIds[0])
      : inArray(sourceStats.domainId, domainIds)

  const rows = await db
    .select({
      referrer:           sourceStats.referrer,
      pageViews:          sql<number>`SUM(${sourceStats.pageViews})`,
      uniqueReaders:      sql<number>`SUM(${sourceStats.uniqueReaders})`,
      avgReadTimeSeconds: sql<number | null>`ROUND(AVG(${sourceStats.avgReadTimeSeconds}))`,
      avgScrollDepthPct:  sql<number | null>`ROUND(AVG(${sourceStats.avgScrollDepthPct}))`,
      readerQualityScore: sql<number | null>`ROUND(AVG(${sourceStats.readerQualityScore})::numeric, 2)`,
    })
    .from(sourceStats)
    .where(and(domainFilter, sql`${sourceStats.date} >= ${sinceDate}::date`))
    .groupBy(sourceStats.referrer)
    .orderBy(sql`SUM(${sourceStats.pageViews}) DESC`)

  return rows.map(r => ({
    referrer:           r.referrer,
    pageViews:          Number(r.pageViews),
    uniqueReaders:      Number(r.uniqueReaders),
    avgReadTimeSeconds: r.avgReadTimeSeconds != null ? Number(r.avgReadTimeSeconds) : null,
    avgScrollDepthPct:  r.avgScrollDepthPct  != null ? Number(r.avgScrollDepthPct)  : null,
    readerQualityScore: r.readerQualityScore  != null ? Number(r.readerQualityScore)  : null,
  }))
}

// ─── Reader journey funnel ────────────────────────────────────────────────────

export type FunnelStage = "new_reader" | "repeat_reader" | "gate_shown" | "converted"

export type FunnelRow = {
  stage: FunnelStage
  label: string
  count: number
  pct: number
}

// 4-stage funnel derived from reader_page_visits + gate_events.
export async function getReaderJourneyFunnel(
  domainIds: string[],
  since: Date,
): Promise<FunnelRow[]> {
  if (domainIds.length === 0) return buildFunnel(0, 0, 0, 0)

  // Per-reader visit stats
  const visitsRows = await db
    .select({
      readerId:  readerPageVisits.readerId,
      visits:    sql<number>`COUNT(*)`,
      sawGate:   sql<boolean>`BOOL_OR(${readerPageVisits.gateShown} = true)`,
    })
    .from(readerPageVisits)
    .where(and(visitsDomainFilter(domainIds), gte(readerPageVisits.occurredAt, since)))
    .groupBy(readerPageVisits.readerId)

  // Converted = distinct readers with gate_passed in window
  const convertedRows = await db
    .selectDistinct({ readerId: gateEvents.readerId })
    .from(gateEvents)
    .where(and(
      gateEventsDomainFilter(domainIds),
      gte(gateEvents.occurredAt, since),
      eq(gateEvents.eventType, "gate_passed"),
    ))

  const convertedSet = new Set(convertedRows.map(r => r.readerId))

  let newReaders = 0, repeatReaders = 0, gateShown = 0, converted = 0
  for (const r of visitsRows) {
    newReaders++
    if (Number(r.visits) >= 2) repeatReaders++
    if (r.sawGate) gateShown++
    if (convertedSet.has(r.readerId)) converted++
  }

  return buildFunnel(newReaders, repeatReaders, gateShown, converted)
}

function buildFunnel(
  newReaders: number,
  repeatReaders: number,
  gateShown: number,
  converted: number,
): FunnelRow[] {
  const stages: { stage: FunnelStage; label: string; count: number }[] = [
    { stage: "new_reader",    label: "New reader",    count: newReaders    },
    { stage: "repeat_reader", label: "Repeat reader", count: repeatReaders },
    { stage: "gate_shown",    label: "Gate shown",    count: gateShown     },
    { stage: "converted",     label: "Converted",     count: converted     },
  ]
  return stages.map(s => ({
    ...s,
    pct: newReaders > 0 ? Math.round((s.count / newReaders) * 100) : 0,
  }))
}

// ─── Active reader count ──────────────────────────────────────────────────────

// Readers active within the last `windowMinutes` based on reader_tokens.updatedAt.
export async function getActiveReaderCount(
  domainIds: string[],
  windowMinutes = 30,
): Promise<number> {
  if (domainIds.length === 0) return 0

  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000)

  const [row] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${readerTokens.readerId})` })
    .from(readerTokens)
    .where(and(tokensDomainFilter(domainIds), gte(readerTokens.updatedAt, cutoff)))

  return Number(row?.count ?? 0)
}

// ─── Audience profile queries (from reader_profiles) ──────────────────────────

export type SegmentRow = {
  segment: string
  count: number
  pct: number
}

// Reader count per segment, scoped to domains via reader_page_visits join.
export async function getSegmentDistribution(
  domainIds: string[],
  since: Date,
): Promise<SegmentRow[]> {
  if (domainIds.length === 0) return []

  const rows = await db
    .select({
      segment: readerProfiles.segment,
      count:   sql<number>`COUNT(DISTINCT ${readerProfiles.readerId})`,
    })
    .from(readerProfiles)
    .innerJoin(readerPageVisits, eq(readerPageVisits.readerId, readerProfiles.readerId))
    .where(and(visitsDomainFilter(domainIds), gte(readerPageVisits.occurredAt, since)))
    .groupBy(readerProfiles.segment)

  const total = rows.reduce((s, r) => s + Number(r.count), 0)
  const ORDER = ["new", "casual", "regular", "power_user"]

  return ORDER
    .map(seg => {
      const row = rows.find(r => r.segment === seg)
      const count = row ? Number(row.count) : 0
      return { segment: seg, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }
    })
    .filter(r => r.count > 0)
}

// ─── Topic interest distribution ──────────────────────────────────────────────

export type TopicRow = {
  category: string
  avgScore: number
  readerCount: number
}

// Aggregate topicInterests JSONB across reader_profiles for the given domains.
// Uses LATERAL jsonb_each_text to expand the JSONB map.
export async function getTopicInterestDistribution(
  domainIds: string[],
  since: Date,
): Promise<TopicRow[]> {
  if (domainIds.length === 0) return []

  // Get distinct reader IDs with profiles in the domain+window scope
  const readerRows = await db
    .selectDistinct({ readerId: readerProfiles.readerId })
    .from(readerProfiles)
    .innerJoin(readerPageVisits, eq(readerPageVisits.readerId, readerProfiles.readerId))
    .where(and(
      visitsDomainFilter(domainIds),
      gte(readerPageVisits.occurredAt, since),
      sql`${readerProfiles.topicInterests} != '{}'::jsonb`,
    ))

  if (readerRows.length === 0) return []

  const readerIds = readerRows.map(r => r.readerId)

  const rows = await db.execute<{ category: string; avg_score: string; reader_count: string }>(sql`
    SELECT
      ti.category,
      ROUND(AVG(ti.score::numeric), 3)::text  AS avg_score,
      COUNT(DISTINCT rp.reader_id)::text       AS reader_count
    FROM reader_profiles rp,
    LATERAL jsonb_each_text(rp.topic_interests) AS ti(category, score)
    WHERE rp.reader_id = ANY(${readerIds})
    GROUP BY ti.category
    ORDER BY AVG(ti.score::numeric) DESC
  `)

  return rows.rows.map(r => ({
    category:    r.category,
    avgScore:    Number(r.avg_score),
    readerCount: Number(r.reader_count),
  }))
}

// ─── Monetization probability histogram ───────────────────────────────────────

export type HistogramRow = {
  bucketLabel: string
  bucketStart: number
  count: number
}

// Distribution of reader_profiles.monetization_probability in 10% buckets.
export async function getMonetizationHistogram(
  domainIds: string[],
  since: Date,
): Promise<HistogramRow[]> {
  if (domainIds.length === 0) return []

  const rows = await db
    .select({
      bucketStart: sql<number>`(FLOOR(${readerProfiles.monetizationProbability} * 10) * 10)::int`,
      count:       sql<number>`COUNT(DISTINCT ${readerProfiles.readerId})`,
    })
    .from(readerProfiles)
    .innerJoin(readerPageVisits, eq(readerPageVisits.readerId, readerProfiles.readerId))
    .where(and(visitsDomainFilter(domainIds), gte(readerPageVisits.occurredAt, since)))
    .groupBy(sql`(FLOOR(${readerProfiles.monetizationProbability} * 10) * 10)::int`)
    .orderBy(sql`(FLOOR(${readerProfiles.monetizationProbability} * 10) * 10)::int ASC`)

  // Fill all 10 buckets (0–90), defaulting missing to 0
  return Array.from({ length: 10 }, (_, i) => {
    const start = i * 10
    const row = rows.find(r => Number(r.bucketStart) === start)
    return {
      bucketLabel: `${start}–${start + 10}%`,
      bucketStart: start,
      count: row ? Number(row.count) : 0,
    }
  })
}

// ─── Visit frequency breakdown ────────────────────────────────────────────────

export type FrequencyRow = {
  frequency: string
  count: number
  pct: number
}

// Distribution of visit frequency from reader_profiles, scoped to domains.
export async function getVisitFrequencyBreakdown(
  domainIds: string[],
  since: Date,
): Promise<FrequencyRow[]> {
  if (domainIds.length === 0) return []

  const rows = await db
    .select({
      frequency: readerProfiles.visitFrequency,
      count:     sql<number>`COUNT(DISTINCT ${readerProfiles.readerId})`,
    })
    .from(readerProfiles)
    .innerJoin(readerPageVisits, eq(readerPageVisits.readerId, readerProfiles.readerId))
    .where(and(visitsDomainFilter(domainIds), gte(readerPageVisits.occurredAt, since)))
    .groupBy(readerProfiles.visitFrequency)

  const total = rows.reduce((s, r) => s + Number(r.count), 0)
  const ORDER = ["daily", "weekly", "occasional", "one_time", "unknown"]

  return ORDER
    .map(freq => {
      const row = rows.find(r => r.frequency === freq)
      const count = row ? Number(row.count) : 0
      return {
        frequency: freq,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      }
    })
    .filter(r => r.count > 0)
}
