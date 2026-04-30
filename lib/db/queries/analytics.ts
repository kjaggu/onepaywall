import { and, eq, gte, inArray, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { analyticsRollups, gateEvents, gates } from "@/lib/db/schema"

export type DailyPoint = {
  date: string  // YYYY-MM-DD
  impressions: number
  gatePasses: number
}

export type AnalyticsSummary = {
  impressions: number
  gatePasses: number
  conversionRate: number  // 0–100
  uniqueReaders: number
}

// Summary stats direct from gate_events — unique_readers is non-additive so can't use rollups here
export async function getSummary(domainIds: string[], since: Date): Promise<AnalyticsSummary> {
  if (domainIds.length === 0) return { impressions: 0, gatePasses: 0, conversionRate: 0, uniqueReaders: 0 }

  const domainFilter =
    domainIds.length === 1
      ? eq(gateEvents.domainId, domainIds[0])
      : inArray(gateEvents.domainId, domainIds)

  const [row] = await db
    .select({
      impressions: sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'gate_shown')`,
      gatePasses: sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'gate_passed')`,
      uniqueReaders: sql<number>`COUNT(DISTINCT ${gateEvents.readerId})`,
    })
    .from(gateEvents)
    .where(and(domainFilter, gte(gateEvents.occurredAt, since)))

  const impressions = Number(row?.impressions ?? 0)
  const gatePasses = Number(row?.gatePasses ?? 0)
  return {
    impressions,
    gatePasses,
    conversionRate: impressions > 0 ? Math.round((gatePasses / impressions) * 100) : 0,
    uniqueReaders: Number(row?.uniqueReaders ?? 0),
  }
}

export type DomainStat = {
  domainId: string
  impressions: number
  gatePasses: number
  conversionRate: number
  uniqueReaders: number
}

export type GateStat = {
  gateId: string
  gateName: string
  impressions: number
  gatePasses: number
  conversionRate: number
  uniqueReaders: number
}

// Per-domain breakdown, one row per domain
export async function getDomainBreakdown(domainIds: string[], since: Date): Promise<DomainStat[]> {
  if (domainIds.length === 0) return []

  const domainFilter =
    domainIds.length === 1
      ? eq(gateEvents.domainId, domainIds[0])
      : inArray(gateEvents.domainId, domainIds)

  const rows = await db
    .select({
      domainId: gateEvents.domainId,
      impressions: sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'gate_shown')`,
      gatePasses: sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'gate_passed')`,
      uniqueReaders: sql<number>`COUNT(DISTINCT ${gateEvents.readerId})`,
    })
    .from(gateEvents)
    .where(and(domainFilter, gte(gateEvents.occurredAt, since)))
    .groupBy(gateEvents.domainId)

  return rows.map(r => {
    const impressions = Number(r.impressions ?? 0)
    const gatePasses = Number(r.gatePasses ?? 0)
    return {
      domainId: r.domainId,
      impressions,
      gatePasses,
      conversionRate: impressions > 0 ? Math.round((gatePasses / impressions) * 100) : 0,
      uniqueReaders: Number(r.uniqueReaders ?? 0),
    }
  })
}

// Per-gate breakdown for a single domain, joined with gate names
export async function getGateBreakdown(domainId: string, since: Date): Promise<GateStat[]> {
  const rows = await db
    .select({
      gateId: gateEvents.gateId,
      gateName: gates.name,
      impressions: sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'gate_shown')`,
      gatePasses: sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'gate_passed')`,
      uniqueReaders: sql<number>`COUNT(DISTINCT ${gateEvents.readerId})`,
    })
    .from(gateEvents)
    .innerJoin(gates, eq(gateEvents.gateId, gates.id))
    .where(and(eq(gateEvents.domainId, domainId), gte(gateEvents.occurredAt, since)))
    .groupBy(gateEvents.gateId, gates.name)

  return rows.map(r => {
    const impressions = Number(r.impressions ?? 0)
    const gatePasses = Number(r.gatePasses ?? 0)
    return {
      gateId: r.gateId,
      gateName: r.gateName,
      impressions,
      gatePasses,
      conversionRate: impressions > 0 ? Math.round((gatePasses / impressions) * 100) : 0,
      uniqueReaders: Number(r.uniqueReaders ?? 0),
    }
  })
}

// 24-hour gate decision counts grouped by hour — for the overview hourly chart
export async function getHourlyDecisions(domainIds: string[]): Promise<Array<{ hour: number; shown: number; passed: number }>> {
  const empty = Array.from({ length: 24 }, (_, h) => ({ hour: h, shown: 0, passed: 0 }))
  if (domainIds.length === 0) return empty

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const domainFilter = domainIds.length === 1
    ? eq(gateEvents.domainId, domainIds[0])
    : inArray(gateEvents.domainId, domainIds)

  const rows = await db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM ${gateEvents.occurredAt})::int`,
      shown:  sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'gate_shown')`,
      passed: sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'gate_passed')`,
    })
    .from(gateEvents)
    .where(and(domainFilter, gte(gateEvents.occurredAt, since)))
    .groupBy(sql`EXTRACT(HOUR FROM ${gateEvents.occurredAt})`)
    .orderBy(sql`EXTRACT(HOUR FROM ${gateEvents.occurredAt})`)

  const map = new Map(rows.map(r => [r.hour, { shown: Number(r.shown), passed: Number(r.passed) }]))
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    shown:  map.get(h)?.shown  ?? 0,
    passed: map.get(h)?.passed ?? 0,
  }))
}

// Daily time-series from rollups, summed across all gates per day
// Pass gateId to isolate a single gate's trend
export async function getDailySeries(domainIds: string[], since: Date, gateId?: string): Promise<DailyPoint[]> {
  if (domainIds.length === 0) return []

  const sinceStr = since.toISOString().split("T")[0]
  const domainFilter =
    domainIds.length === 1
      ? eq(analyticsRollups.domainId, domainIds[0])
      : inArray(analyticsRollups.domainId, domainIds)

  const filters = [domainFilter, sql`${analyticsRollups.date} >= ${sinceStr}`]
  if (gateId) filters.push(eq(analyticsRollups.gateId, gateId))

  const rows = await db
    .select({
      date: analyticsRollups.date,
      impressions: sql<number>`SUM(${analyticsRollups.impressions})`,
      gatePasses: sql<number>`SUM(${analyticsRollups.gatePasses})`,
    })
    .from(analyticsRollups)
    .where(and(...filters))
    .groupBy(analyticsRollups.date)
    .orderBy(analyticsRollups.date)

  return rows.map(r => ({
    date: r.date,
    impressions: Number(r.impressions ?? 0),
    gatePasses: Number(r.gatePasses ?? 0),
  }))
}
