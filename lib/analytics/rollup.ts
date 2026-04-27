import { and, eq, gte, inArray, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { analyticsRollups, gateEvents } from "@/lib/db/schema"

// Compute per-gate-per-day rollups from raw gate_events and upsert into analytics_rollups.
// Safe to call repeatedly — upserts overwrite with fresh counts.
export async function refreshRollups(domainIds: string[], since: Date): Promise<void> {
  if (domainIds.length === 0) return

  const domainFilter =
    domainIds.length === 1
      ? eq(gateEvents.domainId, domainIds[0])
      : inArray(gateEvents.domainId, domainIds)

  const rows = await db
    .select({
      domainId: gateEvents.domainId,
      gateId: gateEvents.gateId,
      date: sql<string>`DATE(${gateEvents.occurredAt})::text`,
      impressions: sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'gate_shown')`,
      gatePasses: sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'gate_passed')`,
      stepCompletions: sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} IN ('ad_complete', 'subscription_cta_click', 'one_time_unlock_complete'))`,
      uniqueReaders: sql<number>`COUNT(DISTINCT ${gateEvents.readerId})`,
    })
    .from(gateEvents)
    .where(and(domainFilter, gte(gateEvents.occurredAt, since)))
    .groupBy(gateEvents.domainId, gateEvents.gateId, sql`DATE(${gateEvents.occurredAt})`)

  if (rows.length === 0) return

  await Promise.all(
    rows.map(row =>
      db
        .insert(analyticsRollups)
        .values({
          domainId: row.domainId,
          gateId: row.gateId,
          date: row.date,
          impressions: Number(row.impressions),
          gatePasses: Number(row.gatePasses),
          stepCompletions: Number(row.stepCompletions),
          uniqueReaders: Number(row.uniqueReaders),
        })
        .onConflictDoUpdate({
          target: [analyticsRollups.domainId, analyticsRollups.gateId, analyticsRollups.date],
          set: {
            impressions: sql`excluded.impressions`,
            gatePasses: sql`excluded.gate_passes`,
            stepCompletions: sql`excluded.step_completions`,
            uniqueReaders: sql`excluded.unique_readers`,
            updatedAt: new Date(),
          },
        }),
    ),
  )
}
