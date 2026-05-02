import { and, eq, gte, inArray, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { readerPageVisits, readerProfiles, sourceStats } from "@/lib/db/schema"

// Aggregate reader_page_visits + reader_profiles into daily per-domain per-referrer rows.
// reader_quality_score = avg monetization_probability of readers from each source.
// Upserts into source_stats. Safe to call repeatedly.
export async function refreshSourceStats(domainIds: string[], since: Date): Promise<void> {
  if (domainIds.length === 0) return

  const domainFilter =
    domainIds.length === 1
      ? eq(readerPageVisits.domainId, domainIds[0])
      : inArray(readerPageVisits.domainId, domainIds)

  const rows = await db
    .select({
      domainId:           readerPageVisits.domainId,
      date:               sql<string>`DATE(${readerPageVisits.occurredAt})::text`,
      referrer:           sql<string>`COALESCE(${readerPageVisits.referrer}, 'direct')`,
      pageViews:          sql<number>`COUNT(*)`,
      uniqueReaders:      sql<number>`COUNT(DISTINCT ${readerPageVisits.readerId})`,
      avgReadTimeSeconds: sql<number | null>`ROUND(AVG(${readerPageVisits.readTimeSeconds}))`,
      avgScrollDepthPct:  sql<number | null>`ROUND(AVG(${readerPageVisits.scrollDepthPct}))`,
      readerQualityScore: sql<number | null>`ROUND(AVG(${readerProfiles.monetizationProbability})::numeric, 3)`,
    })
    .from(readerPageVisits)
    .leftJoin(readerProfiles, eq(readerProfiles.readerId, readerPageVisits.readerId))
    .where(and(domainFilter, gte(readerPageVisits.occurredAt, since)))
    .groupBy(
      readerPageVisits.domainId,
      sql`DATE(${readerPageVisits.occurredAt})`,
      sql`COALESCE(${readerPageVisits.referrer}, 'direct')`,
    )

  if (rows.length === 0) return

  await Promise.all(
    rows.map(row =>
      db
        .insert(sourceStats)
        .values({
          domainId:           row.domainId,
          date:               row.date,
          referrer:           row.referrer,
          pageViews:          Number(row.pageViews),
          uniqueReaders:      Number(row.uniqueReaders),
          avgReadTimeSeconds: row.avgReadTimeSeconds != null ? Number(row.avgReadTimeSeconds) : null,
          avgScrollDepthPct:  row.avgScrollDepthPct  != null ? Number(row.avgScrollDepthPct)  : null,
          readerQualityScore: row.readerQualityScore  != null ? Number(row.readerQualityScore)  : null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [sourceStats.domainId, sourceStats.date, sourceStats.referrer],
          set: {
            pageViews:          sql`excluded.page_views`,
            uniqueReaders:      sql`excluded.unique_readers`,
            avgReadTimeSeconds: sql`excluded.avg_read_time_seconds`,
            avgScrollDepthPct:  sql`excluded.avg_scroll_depth_pct`,
            readerQualityScore: sql`excluded.reader_quality_score`,
            updatedAt:          new Date(),
          },
        }),
    ),
  )
}
