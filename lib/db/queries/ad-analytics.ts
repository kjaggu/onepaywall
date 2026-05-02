import { and, eq, gte, inArray, isNotNull, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { adUnits, gateEvents, readerProfiles } from "@/lib/db/schema"

export type AdUnitStat = {
  adUnitId: string
  adUnitName: string
  impressions: number
  completions: number
  skips: number
  ctaClicks: number
  completionRate: number  // 0–100
  skipRate: number        // 0–100
  ctr: number             // 0–100 — CTA clicks / impressions
  fillRate: number        // 0–100 — populated separately
}

export type AdSegmentStat = {
  segment: string
  impressions: number
  completionRate: number
}

export type AdCategoryStat = {
  category: string
  impressions: number
  completionRate: number
}

export type AdAnalyticsSummary = {
  totalImpressions: number
  overallCompletionRate: number
  overallSkipRate: number
  topAdUnitId: string | null
}

function domainFilter(domainIds: string[]) {
  return domainIds.length === 1
    ? eq(gateEvents.domainId, domainIds[0])
    : inArray(gateEvents.domainId, domainIds)
}

export async function getAdUnitStats(domainIds: string[], since: Date): Promise<AdUnitStat[]> {
  if (domainIds.length === 0) return []

  const [adRows, gateShownRows] = await Promise.all([
    // Per-unit ad event counts
    db
      .select({
        adUnitId:    gateEvents.adUnitId,
        adUnitName:  adUnits.name,
        impressions: sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'ad_start')`,
        completions: sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'ad_complete')`,
        skips:       sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'ad_skip')`,
        ctaClicks:   sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'ad_cta_click')`,
      })
      .from(gateEvents)
      .innerJoin(adUnits, eq(gateEvents.adUnitId, adUnits.id))
      .where(
        and(
          domainFilter(domainIds),
          gte(gateEvents.occurredAt, since),
          isNotNull(gateEvents.adUnitId),
        )
      )
      .groupBy(gateEvents.adUnitId, adUnits.name),

    // Total gate_shown events — used for fill rate denominator
    db
      .select({
        total: sql<number>`COUNT(*)`,
      })
      .from(gateEvents)
      .where(
        and(
          domainFilter(domainIds),
          gte(gateEvents.occurredAt, since),
          eq(gateEvents.eventType, "gate_shown"),
        )
      ),
  ])

  const gateShown = Number(gateShownRows[0]?.total ?? 0)

  return adRows
    .filter(r => r.adUnitId !== null)
    .map(r => {
      const impressions = Number(r.impressions ?? 0)
      const completions = Number(r.completions ?? 0)
      const skips = Number(r.skips ?? 0)
      const ctaClicks = Number(r.ctaClicks ?? 0)
      return {
        adUnitId:       r.adUnitId!,
        adUnitName:     r.adUnitName,
        impressions,
        completions,
        skips,
        ctaClicks,
        completionRate: impressions > 0 ? Math.round((completions / impressions) * 100) : 0,
        skipRate:       impressions > 0 ? Math.round((skips / impressions) * 100) : 0,
        ctr:            impressions > 0 ? Math.round((ctaClicks / impressions) * 100) : 0,
        fillRate:       gateShown > 0 ? Math.round((impressions / gateShown) * 100) : 0,
      }
    })
}

export async function getAdSegmentStats(domainIds: string[], since: Date): Promise<AdSegmentStat[]> {
  if (domainIds.length === 0) return []

  const rows = await db
    .select({
      segment:     readerProfiles.segment,
      impressions: sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'ad_start')`,
      completions: sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'ad_complete')`,
    })
    .from(gateEvents)
    .innerJoin(readerProfiles, eq(gateEvents.readerId, readerProfiles.readerId))
    .where(
      and(
        domainFilter(domainIds),
        gte(gateEvents.occurredAt, since),
        inArray(gateEvents.eventType, ["ad_start", "ad_complete"]),
      )
    )
    .groupBy(readerProfiles.segment)

  return rows.map(r => {
    const impressions = Number(r.impressions ?? 0)
    const completions = Number(r.completions ?? 0)
    return {
      segment:        r.segment,
      impressions,
      completionRate: impressions > 0 ? Math.round((completions / impressions) * 100) : 0,
    }
  })
}

export async function getAdCategoryStats(domainIds: string[], since: Date): Promise<AdCategoryStat[]> {
  if (domainIds.length === 0) return []

  const rows = await db.execute(sql`
    SELECT
      cat AS category,
      COUNT(*) FILTER (WHERE ge.event_type = 'ad_start')    AS impressions,
      COUNT(*) FILTER (WHERE ge.event_type = 'ad_complete') AS completions
    FROM gate_events ge
    JOIN ad_units au ON au.id = ge.ad_unit_id
    CROSS JOIN UNNEST(au.relevant_categories) AS cat
    WHERE ge.domain_id = ANY(${domainIds})
      AND ge.occurred_at >= ${since}
      AND ge.event_type IN ('ad_start', 'ad_complete')
      AND ge.ad_unit_id IS NOT NULL
    GROUP BY cat
    ORDER BY impressions DESC
  `)

  return (rows as unknown as Array<{ category: string; impressions: number | string; completions: number | string }>).map(r => {
    const impressions = Number(r.impressions ?? 0)
    const completions = Number(r.completions ?? 0)
    return {
      category:       r.category,
      impressions,
      completionRate: impressions > 0 ? Math.round((completions / impressions) * 100) : 0,
    }
  })
}

export async function getAdAnalyticsSummary(domainIds: string[], since: Date): Promise<AdAnalyticsSummary> {
  if (domainIds.length === 0) {
    return { totalImpressions: 0, overallCompletionRate: 0, overallSkipRate: 0, topAdUnitId: null }
  }

  const [summaryRow, topRow] = await Promise.all([
    db
      .select({
        impressions: sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'ad_start')`,
        completions: sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'ad_complete')`,
        skips:       sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'ad_skip')`,
      })
      .from(gateEvents)
      .where(and(domainFilter(domainIds), gte(gateEvents.occurredAt, since))),

    db
      .select({ adUnitId: gateEvents.adUnitId, count: sql<number>`COUNT(*)` })
      .from(gateEvents)
      .where(
        and(
          domainFilter(domainIds),
          gte(gateEvents.occurredAt, since),
          eq(gateEvents.eventType, "ad_start"),
          isNotNull(gateEvents.adUnitId),
        )
      )
      .groupBy(gateEvents.adUnitId)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(1),
  ])

  const r = summaryRow[0]
  const impressions = Number(r?.impressions ?? 0)
  const completions = Number(r?.completions ?? 0)
  const skips = Number(r?.skips ?? 0)

  return {
    totalImpressions:      impressions,
    overallCompletionRate: impressions > 0 ? Math.round((completions / impressions) * 100) : 0,
    overallSkipRate:       impressions > 0 ? Math.round((skips / impressions) * 100) : 0,
    topAdUnitId:           topRow[0]?.adUnitId ?? null,
  }
}
