import { eq, gte, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { readerPageVisits, readerProfiles, gateEvents } from "@/lib/db/schema"
import { classifyContentBatch, type ContentCategory } from "./classifyContent"

// ─── Constants ────────────────────────────────────────────────────────────────

const NINETY_DAYS_MS  = 90 * 24 * 60 * 60 * 1000
const THIRTY_DAYS_MS  = 30 * 24 * 60 * 60 * 1000
const SIXTY_DAYS_MS   = 60 * 24 * 60 * 60 * 1000

// ─── Helpers ──────────────────────────────────────────────────────────────────

function decayWeight(occurredAt: Date): number {
  const ageMs = Date.now() - occurredAt.getTime()
  if (ageMs > SIXTY_DAYS_MS)  return 0.2
  if (ageMs > THIRTY_DAYS_MS) return 0.5
  return 1.0
}

function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, v))
}

// Normalize a map of raw scores to [0, 1] relative to the max score.
function normalizeScores(scores: Map<string, number>): Record<string, number> {
  const max = Math.max(...scores.values(), 0)
  if (max === 0) return {}
  const out: Record<string, number> = {}
  for (const [k, v] of scores) {
    const normalized = v / max
    if (normalized >= 0.05) out[k] = Math.round(normalized * 100) / 100
  }
  return out
}

// ─── Segment determination ────────────────────────────────────────────────────

type ReaderSegment = "new" | "casual" | "regular" | "power_user"
type VisitFrequency = "unknown" | "one_time" | "occasional" | "weekly" | "daily"

function determineSegment(totalVisits: number, monetizationProbability: number): ReaderSegment {
  if (totalVisits <= 2)  return "new"
  if (totalVisits <= 5 && monetizationProbability < 0.3)  return "casual"
  if (totalVisits >= 20 || monetizationProbability >= 0.65) return "power_user"
  if (totalVisits >= 6)  return "regular"
  return "casual"
}

function determineVisitFrequency(visits: Array<{ occurredAt: Date }>): VisitFrequency {
  if (visits.length === 0) return "unknown"
  if (visits.length === 1) return "one_time"

  // Look at spread of visits over the last 90 days
  const sorted = [...visits].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
  const spanDays = (sorted[sorted.length - 1].occurredAt.getTime() - sorted[0].occurredAt.getTime()) / (24 * 60 * 60 * 1000)

  if (spanDays === 0) return "one_time"
  const visitsPerDay = visits.length / Math.max(spanDays, 1)
  if (visitsPerDay >= 1)   return "daily"
  if (visitsPerDay >= 0.1) return "weekly"   // roughly once per 10 days
  return "occasional"
}

// ─── Core computation ─────────────────────────────────────────────────────────

export async function computeProfile(readerId: string): Promise<void> {
  const since = new Date(Date.now() - NINETY_DAYS_MS)

  // 1. Fetch all page visits in the window
  const visits = await db
    .select({
      url:             readerPageVisits.url,
      domainId:        readerPageVisits.domainId,
      readTimeSeconds: readerPageVisits.readTimeSeconds,
      scrollDepthPct:  readerPageVisits.scrollDepthPct,
      occurredAt:      readerPageVisits.occurredAt,
      isSubscriber:    readerPageVisits.isSubscriber,
      gateShown:       readerPageVisits.gateShown,
    })
    .from(readerPageVisits)
    .where(
      sql`${readerPageVisits.readerId} = ${readerId} AND ${readerPageVisits.occurredAt} >= ${since}`,
    )

  const totalVisits = visits.length

  // 2. Classify all URLs in one batch query
  const uniqueUrls = [...new Set(visits.map(v => v.url))]
  const urlCategories = await classifyContentBatch(uniqueUrls)

  // 3. Engagement score: weighted avg of normalised read time + scroll depth
  //    read time cap = 600s (10 min), scroll cap = 100%
  let engagementSum = 0
  let engagementWeight = 0
  for (const v of visits) {
    const w = decayWeight(v.occurredAt)
    const readNorm  = v.readTimeSeconds  != null ? clamp(v.readTimeSeconds  / 600) : 0.2
    const scrollNorm = v.scrollDepthPct  != null ? clamp(v.scrollDepthPct   / 100) : 0.2
    engagementSum    += (readNorm * 0.5 + scrollNorm * 0.5) * w
    engagementWeight += w
  }
  const engagementScore = engagementWeight > 0 ? clamp(engagementSum / engagementWeight) : 0

  // 4. Ad completion rate from gate_events
  const [adRow] = await db
    .select({
      starts:      sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'ad_start')::int`,
      completions: sql<number>`COUNT(*) FILTER (WHERE ${gateEvents.eventType} = 'ad_complete')::int`,
    })
    .from(gateEvents)
    .where(
      sql`${gateEvents.readerId} = ${readerId} AND ${gateEvents.occurredAt} >= ${since}`,
    )

  const adStarts = Number(adRow?.starts ?? 0)
  const adCompletionRate = adStarts > 0 ? clamp(Number(adRow?.completions ?? 0) / adStarts) : 0

  // 5. Visit frequency
  const visitFrequency = determineVisitFrequency(visits)

  // Visit frequency as numeric (0–1) for the monetization formula
  const visitFreqScore = {
    unknown: 0, one_time: 0.1, occasional: 0.3, weekly: 0.6, daily: 1.0,
  }[visitFrequency]

  // 6. Domain breadth (unique domains visited)
  const uniqueDomains = new Set(visits.map(v => v.domainId))
  const totalDomains = uniqueDomains.size
  // Cap at 5 for scoring; more domains = more breadth
  const domainBreadthScore = clamp(totalDomains / 5)

  // 7. Topic interests with time decay — cross-publisher (no domain filter)
  //    topicInterests: per-category decay-weighted visit counts, normalized
  const topicScores = new Map<ContentCategory, number>()
  for (const v of visits) {
    const categories = urlCategories.get(v.url) ?? []
    const w = decayWeight(v.occurredAt)
    for (const cat of categories) {
      topicScores.set(cat, (topicScores.get(cat) ?? 0) + w)
    }
  }
  const topicInterests = normalizeScores(topicScores as Map<string, number>)

  // 8. Cross-publisher interests: same aggregation but annotated with domain count per topic
  //    This richer structure is for advertiser targeting (Phase 5)
  const crossPublisherInterests: Record<string, { score: number; domainCount: number }> = {}
  for (const [cat, score] of Object.entries(topicInterests)) {
    // Count distinct domains where this topic appeared
    const domainsForTopic = new Set(
      visits
        .filter(v => (urlCategories.get(v.url) ?? []).includes(cat as ContentCategory))
        .map(v => v.domainId)
    )
    crossPublisherInterests[cat] = { score, domainCount: domainsForTopic.size }
  }

  // 9. Topic depth: how concentrated vs scattered (0 = spread thin, 1 = single topic)
  const topicValues = Object.values(topicInterests)
  let topicDepthScore = 0
  if (topicValues.length > 0) {
    const maxScore = Math.max(...topicValues)
    const avgScore = topicValues.reduce((a, b) => a + b, 0) / topicValues.length
    topicDepthScore = topicValues.length === 1 ? 1.0 : clamp(maxScore / Math.max(avgScore * topicValues.length, 1))
  }

  // 10. Monetization probability (from schema doc formula):
  //     0.35×engagement + 0.25×ad_rate + 0.20×visit_freq + 0.10×topic_depth + 0.10×domain_breadth
  const monetizationProbability = clamp(
    0.35 * engagementScore +
    0.25 * adCompletionRate +
    0.20 * visitFreqScore +
    0.10 * topicDepthScore +
    0.10 * domainBreadthScore
  )

  // 11. Segment
  const segment = determineSegment(totalVisits, monetizationProbability)

  // 12. Upsert reader_profiles
  await db
    .insert(readerProfiles)
    .values({
      readerId,
      segment,
      engagementScore,
      adCompletionRate,
      monetizationProbability,
      topicInterests,
      crossPublisherInterests,
      visitFrequency,
      totalVisits,
      totalDomains,
      profileVersion: 1,
      lastComputedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: readerProfiles.readerId,
      set: {
        segment,
        engagementScore,
        adCompletionRate,
        monetizationProbability,
        topicInterests,
        crossPublisherInterests,
        visitFrequency,
        totalVisits,
        totalDomains,
        profileVersion: sql`${readerProfiles.profileVersion} + 1`,
        lastComputedAt: new Date(),
        updatedAt: new Date(),
      },
    })
}

