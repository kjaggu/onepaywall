import { and, eq, gte, isNotNull, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { readerPageVisits } from "@/lib/db/schema"

export type SubscriberSegmentStats = {
  segment: "subscriber" | "non_subscriber"
  pageviews: number
  uniqueReaders: number
  avgReadTimeSeconds: number | null
  avgScrollDepthPct: number | null
  gateShownCount: number
}

// Per-segment pageview + engagement breakdown for a domain over the given window.
// Only counts visits where is_subscriber is stamped (i.e. after this feature shipped).
export async function getSubscriberSegmentStats(
  domainId: string,
  since: Date,
): Promise<SubscriberSegmentStats[]> {
  const rows = await db
    .select({
      isSubscriber: readerPageVisits.isSubscriber,
      pageviews: sql<number>`COUNT(*)`,
      uniqueReaders: sql<number>`COUNT(DISTINCT ${readerPageVisits.readerId})`,
      avgReadTime: sql<number | null>`AVG(${readerPageVisits.readTimeSeconds})`,
      avgScrollDepth: sql<number | null>`AVG(${readerPageVisits.scrollDepthPct})`,
      gateShownCount: sql<number>`COUNT(*) FILTER (WHERE ${readerPageVisits.gateShown} = true)`,
    })
    .from(readerPageVisits)
    .where(and(
      eq(readerPageVisits.domainId, domainId),
      gte(readerPageVisits.occurredAt, since),
      isNotNull(readerPageVisits.isSubscriber),
    ))
    .groupBy(readerPageVisits.isSubscriber)

  return rows.map(r => ({
    segment: r.isSubscriber ? "subscriber" : "non_subscriber",
    pageviews: Number(r.pageviews),
    uniqueReaders: Number(r.uniqueReaders),
    avgReadTimeSeconds: r.avgReadTime != null ? Math.round(Number(r.avgReadTime)) : null,
    avgScrollDepthPct: r.avgScrollDepth != null ? Math.round(Number(r.avgScrollDepth)) : null,
    gateShownCount: Number(r.gateShownCount),
  }))
}

// Daily breakdown of subscriber vs non-subscriber pageviews — useful for trend charts.
export async function getSubscriberPageviewTrend(
  domainId: string,
  since: Date,
): Promise<{ date: string; subscriberPageviews: number; nonSubscriberPageviews: number }[]> {
  const rows = await db
    .select({
      date: sql<string>`DATE(${readerPageVisits.occurredAt})::text`,
      subscriberPageviews: sql<number>`COUNT(*) FILTER (WHERE ${readerPageVisits.isSubscriber} = true)`,
      nonSubscriberPageviews: sql<number>`COUNT(*) FILTER (WHERE ${readerPageVisits.isSubscriber} = false)`,
    })
    .from(readerPageVisits)
    .where(and(
      eq(readerPageVisits.domainId, domainId),
      gte(readerPageVisits.occurredAt, since),
      isNotNull(readerPageVisits.isSubscriber),
    ))
    .groupBy(sql`DATE(${readerPageVisits.occurredAt})`)
    .orderBy(sql`DATE(${readerPageVisits.occurredAt})`)

  return rows.map(r => ({
    date: r.date,
    subscriberPageviews: Number(r.subscriberPageviews),
    nonSubscriberPageviews: Number(r.nonSubscriberPageviews),
  }))
}

// Gate exposure rate for non-subscribers: % of non-subscriber visits where a gate was shown.
// High rate = gate is triggering broadly. Low rate = gate triggers are too restrictive.
export async function getGateExposureRate(
  domainId: string,
  since: Date,
): Promise<{ totalNonSubscriberVisits: number; gateShownVisits: number; exposureRatePct: number }> {
  const [row] = await db
    .select({
      total: sql<number>`COUNT(*) FILTER (WHERE ${readerPageVisits.isSubscriber} = false)`,
      gateShown: sql<number>`COUNT(*) FILTER (WHERE ${readerPageVisits.isSubscriber} = false AND ${readerPageVisits.gateShown} = true)`,
    })
    .from(readerPageVisits)
    .where(and(
      eq(readerPageVisits.domainId, domainId),
      gte(readerPageVisits.occurredAt, since),
      isNotNull(readerPageVisits.isSubscriber),
    ))

  const total = Number(row?.total ?? 0)
  const shown = Number(row?.gateShown ?? 0)
  return {
    totalNonSubscriberVisits: total,
    gateShownVisits: shown,
    exposureRatePct: total > 0 ? Math.round((shown / total) * 100) : 0,
  }
}
