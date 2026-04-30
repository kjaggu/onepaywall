import { and, eq, gte, inArray, isNotNull, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { readerPageVisits, readerProfiles } from "@/lib/db/schema"

// ─── Types ────────────────────────────────────────────────────────────────────

export type AudienceStats = {
  totalReaders: number
  subscriberReaders: number
  visitorReaders: number
  conversionOpportunity: number  // non-subscribers who hit a gate ≥ once (in-funnel, not converted)
  subscriberPageviews: number
  visitorPageviews: number
  subscriberAvgReadTime: number | null
  visitorAvgReadTime: number | null
  subscriberAvgScroll: number | null
  visitorAvgScroll: number | null
  gateExposureRatePct: number    // % of visitor pageviews where a gate was shown
}

export type IntentTier = "subscriber" | "high_intent" | "engaged" | "casual"

export type TierStats = {
  tier: IntentTier
  label: string
  description: string
  readerCount: number
  pct: number
  avgScrollDepth: number | null
  avgReadTimeSeconds: number | null
}

export const TIER_META: Record<IntentTier, { label: string; description: string; color: string }> = {
  subscriber:  { label: "Subscribers",  description: "Active paying readers",                              color: "#27adb0" },
  high_intent: { label: "High intent",  description: "Hit a gate, deeply engaged, haven't converted yet", color: "#6366f1" },
  engaged:     { label: "Engaged",      description: "Regular readers, not yet in the monetisation funnel", color: "#f59e0b" },
  casual:      { label: "Casual",       description: "Occasional visitors, low engagement depth",          color: "#d1d5db" },
}

// ─── Queries ──────────────────────────────────────────────────────────────────

function domainFilter(domainIds: string[]) {
  return domainIds.length === 1
    ? eq(readerPageVisits.domainId, domainIds[0])
    : inArray(readerPageVisits.domainId, domainIds)
}

// Aggregate audience stats for the given domains + time window.
// Only counts visits where is_subscriber is stamped (i.e. after the feature shipped).
export async function getAudienceStats(domainIds: string[], since: Date): Promise<AudienceStats> {
  if (domainIds.length === 0) return {
    totalReaders: 0, subscriberReaders: 0, visitorReaders: 0,
    conversionOpportunity: 0, subscriberPageviews: 0, visitorPageviews: 0,
    subscriberAvgReadTime: null, visitorAvgReadTime: null,
    subscriberAvgScroll: null, visitorAvgScroll: null,
    gateExposureRatePct: 0,
  }

  const [row] = await db
    .select({
      totalReaders:           sql<number>`COUNT(DISTINCT ${readerPageVisits.readerId})`,
      subscriberReaders:      sql<number>`COUNT(DISTINCT ${readerPageVisits.readerId}) FILTER (WHERE ${readerPageVisits.isSubscriber} = true)`,
      visitorReaders:         sql<number>`COUNT(DISTINCT ${readerPageVisits.readerId}) FILTER (WHERE ${readerPageVisits.isSubscriber} = false)`,
      conversionOpportunity:  sql<number>`COUNT(DISTINCT ${readerPageVisits.readerId}) FILTER (WHERE ${readerPageVisits.isSubscriber} = false AND ${readerPageVisits.gateShown} = true)`,
      subscriberPageviews:    sql<number>`COUNT(*) FILTER (WHERE ${readerPageVisits.isSubscriber} = true)`,
      visitorPageviews:       sql<number>`COUNT(*) FILTER (WHERE ${readerPageVisits.isSubscriber} = false)`,
      visitorGateShown:       sql<number>`COUNT(*) FILTER (WHERE ${readerPageVisits.isSubscriber} = false AND ${readerPageVisits.gateShown} = true)`,
      subscriberAvgReadTime:  sql<number | null>`ROUND(AVG(${readerPageVisits.readTimeSeconds}) FILTER (WHERE ${readerPageVisits.isSubscriber} = true))`,
      visitorAvgReadTime:     sql<number | null>`ROUND(AVG(${readerPageVisits.readTimeSeconds}) FILTER (WHERE ${readerPageVisits.isSubscriber} = false))`,
      subscriberAvgScroll:    sql<number | null>`ROUND(AVG(${readerPageVisits.scrollDepthPct}) FILTER (WHERE ${readerPageVisits.isSubscriber} = true))`,
      visitorAvgScroll:       sql<number | null>`ROUND(AVG(${readerPageVisits.scrollDepthPct}) FILTER (WHERE ${readerPageVisits.isSubscriber} = false))`,
    })
    .from(readerPageVisits)
    .where(and(
      domainFilter(domainIds),
      gte(readerPageVisits.occurredAt, since),
      isNotNull(readerPageVisits.isSubscriber),
    ))

  const visitorPVs = Number(row?.visitorPageviews ?? 0)
  const visitorGateShown = Number(row?.visitorGateShown ?? 0)

  return {
    totalReaders:          Number(row?.totalReaders ?? 0),
    subscriberReaders:     Number(row?.subscriberReaders ?? 0),
    visitorReaders:        Number(row?.visitorReaders ?? 0),
    conversionOpportunity: Number(row?.conversionOpportunity ?? 0),
    subscriberPageviews:   Number(row?.subscriberPageviews ?? 0),
    visitorPageviews:      visitorPVs,
    subscriberAvgReadTime: row?.subscriberAvgReadTime != null ? Number(row.subscriberAvgReadTime) : null,
    visitorAvgReadTime:    row?.visitorAvgReadTime    != null ? Number(row.visitorAvgReadTime)    : null,
    subscriberAvgScroll:   row?.subscriberAvgScroll   != null ? Number(row.subscriberAvgScroll)   : null,
    visitorAvgScroll:      row?.visitorAvgScroll      != null ? Number(row.visitorAvgScroll)      : null,
    gateExposureRatePct:   visitorPVs > 0 ? Math.round((visitorGateShown / visitorPVs) * 100) : 0,
  }
}

// Bucket every unique reader in the window into one of four intent tiers.
// Tiers are assigned per-reader based on aggregated behaviour signals:
//   subscriber   — any visit in window with is_subscriber = true
//   high_intent  — non-sub, hit a gate, avg scroll ≥ 60% OR avg read time ≥ 90s, ≥ 3 visits
//   engaged      — non-sub, ≥ 2 visits, avg scroll ≥ 30%
//   casual       — everything else
//
// Per-reader aggregation is done in the DB; tier assignment is done in JS to
// keep the query simple and avoid CTE dialect issues with the HTTP driver.
export async function getIntentTierDistribution(domainIds: string[], since: Date): Promise<TierStats[]> {
  if (domainIds.length === 0) return buildTierStats(new Map(), 0)

  const rows = await db
    .select({
      readerId:    readerPageVisits.readerId,
      visitCount:  sql<number>`COUNT(*)::int`,
      isSubscriber: sql<boolean>`BOOL_OR(${readerPageVisits.isSubscriber})`,
      gateShown:   sql<boolean>`BOOL_OR(${readerPageVisits.gateShown})`,
      avgScroll:   sql<number>`COALESCE(ROUND(AVG(${readerPageVisits.scrollDepthPct}))::int, 0)`,
      avgReadTime: sql<number>`COALESCE(ROUND(AVG(${readerPageVisits.readTimeSeconds}))::int, 0)`,
    })
    .from(readerPageVisits)
    .where(and(
      domainFilter(domainIds),
      gte(readerPageVisits.occurredAt, since),
      isNotNull(readerPageVisits.isSubscriber),
    ))
    .groupBy(readerPageVisits.readerId)

  const tierBuckets = new Map<IntentTier, { count: number; scrollSum: number; readTimeSum: number }>([
    ["subscriber",  { count: 0, scrollSum: 0, readTimeSum: 0 }],
    ["high_intent", { count: 0, scrollSum: 0, readTimeSum: 0 }],
    ["engaged",     { count: 0, scrollSum: 0, readTimeSum: 0 }],
    ["casual",      { count: 0, scrollSum: 0, readTimeSum: 0 }],
  ])

  for (const r of rows) {
    const tier = assignTier(r)
    const bucket = tierBuckets.get(tier)!
    bucket.count++
    bucket.scrollSum   += Number(r.avgScroll)
    bucket.readTimeSum += Number(r.avgReadTime)
  }

  return buildTierStats(tierBuckets, rows.length)
}

function assignTier(r: {
  isSubscriber: boolean
  gateShown: boolean
  avgScroll: number
  avgReadTime: number
  visitCount: number
}): IntentTier {
  if (r.isSubscriber) return "subscriber"
  if (r.gateShown && (r.avgScroll >= 60 || r.avgReadTime >= 90) && r.visitCount >= 3) return "high_intent"
  if (r.visitCount >= 2 && r.avgScroll >= 30) return "engaged"
  return "casual"
}

function buildTierStats(
  buckets: Map<IntentTier, { count: number; scrollSum: number; readTimeSum: number }>,
  total: number,
): TierStats[] {
  const ORDER: IntentTier[] = ["subscriber", "high_intent", "engaged", "casual"]
  return ORDER.map(tier => {
    const b = buckets.get(tier) ?? { count: 0, scrollSum: 0, readTimeSum: 0 }
    return {
      tier,
      label:              TIER_META[tier].label,
      description:        TIER_META[tier].description,
      readerCount:        b.count,
      pct:               total > 0 ? Math.round((b.count / total) * 100) : 0,
      avgScrollDepth:    b.count > 0 ? Math.round(b.scrollSum   / b.count) : null,
      avgReadTimeSeconds: b.count > 0 ? Math.round(b.readTimeSum / b.count) : null,
    }
  })
}

// ─── Reader profile queries ───────────────────────────────────────────────────

export type ReaderProfile = typeof readerProfiles.$inferSelect

// Returns the computed profile for a reader, or null if not yet computed.
export async function getReaderProfile(readerId: string): Promise<ReaderProfile | null> {
  const [row] = await db
    .select()
    .from(readerProfiles)
    .where(eq(readerProfiles.readerId, readerId))
    .limit(1)
  return row ?? null
}

// Returns reader IDs whose profile is stale or missing.
// "Stale" means: last_computed_at is older than lastSeenAt in readers table,
// i.e. there are new visits since the last computation.
// The cron job calls this to find work to do.
export async function getStalePotentialProfileReaderIds(limit: number): Promise<string[]> {
  // Find reader_ids in reader_page_visits that either:
  // (a) have no reader_profiles row yet, OR
  // (b) have visits newer than last_computed_at
  const rows = await db.execute<{ reader_id: string }>(
    sql`
      SELECT DISTINCT rpv.reader_id
      FROM reader_page_visits rpv
      LEFT JOIN reader_profiles rp ON rp.reader_id = rpv.reader_id
      WHERE rp.reader_id IS NULL
         OR rpv.occurred_at > rp.last_computed_at
      LIMIT ${limit}
    `
  )
  return rows.rows.map(r => r.reader_id)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmtReadTime(seconds: number | null): string {
  if (seconds == null) return "—"
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}
