import { and, desc, eq, gt, gte, isNull, lt, or, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import {
  domains,
  gateEvents,
  gates,
  plans,
  publisherMembers,
  publisherOverageCharges,
  publishers,
  subscriptions,
  users,
} from "@/lib/db/schema"

// ─── Shared helpers ───────────────────────────────────────────────────────────

// Fetches the most-recent subscription per publisher via a single GROUP BY query,
// then joins with plans in JS. Returns a map keyed by publisherId.
async function getLatestSubMap(publisherIds?: string[]) {
  // "Latest subscription per publisher" using DISTINCT ON
  type SubRow = {
    publisher_id: string
    plan_slug: string
    status: string
    current_period_end: Date | null
    plan_name: string
    price_monthly: number | null
  }

  const result = await db.execute<SubRow>(sql`
    SELECT DISTINCT ON (s.publisher_id)
      s.publisher_id,
      s.plan_slug,
      s.status,
      s.current_period_end,
      p.name AS plan_name,
      p.price_monthly
    FROM subscriptions s
    JOIN plans p ON p.slug = s.plan_slug
    ORDER BY s.publisher_id, s.created_at DESC
  `)

  const map = new Map<string, SubRow>()
  for (const r of result.rows) {
    if (!publisherIds || publisherIds.includes(r.publisher_id)) {
      map.set(r.publisher_id, r)
    }
  }
  return map
}

// Domain count per publisher (active domains only)
async function getDomainCountMap(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      publisherId: domains.publisherId,
      count:       sql<number>`COUNT(*)::int`,
    })
    .from(domains)
    .where(isNull(domains.deletedAt))
    .groupBy(domains.publisherId)
  return new Map(rows.map(r => [r.publisherId, Number(r.count)]))
}

// Member count per publisher
async function getMemberCountMap(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      publisherId: publisherMembers.publisherId,
      count:       sql<number>`COUNT(*)::int`,
    })
    .from(publisherMembers)
    .groupBy(publisherMembers.publisherId)
  return new Map(rows.map(r => [r.publisherId, Number(r.count)]))
}

// ─── Platform overview stats ──────────────────────────────────────────────────

export type PlatformStats = {
  activeMRR: number
  activePublishers: number
  trialingPublishers: number
  totalDomains: number
  gateDecisions24h: number
  recentPublishers: {
    id: string
    name: string
    slug: string
    createdAt: Date
    planSlug: string | null
    planName: string | null
    subStatus: string | null
    priceMonthly: number | null
    domainCount: number
  }[]
  mrrByPlan: { planSlug: string; planName: string; priceMonthly: number; count: number }[]
  alerts: { id: string; name: string; status: string; currentPeriodEnd: Date | null }[]
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const since24h = new Date(Date.now() - 86_400_000)
  const in7days  = new Date(Date.now() + 7 * 86_400_000)

  const [mrrRows, domainRows, decisionsRows, mrrByPlanRows, alertRows, recentRows, domainCountMap] =
    await Promise.all([
      // Active platform MRR
      db
        .select({ total: sql<number>`COALESCE(SUM(${plans.priceMonthly}), 0)::int` })
        .from(subscriptions)
        .innerJoin(plans, eq(subscriptions.planSlug, plans.slug))
        .where(eq(subscriptions.status, "active")),

      // Total active domains
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(domains)
        .where(isNull(domains.deletedAt)),

      // Gate decisions in last 24h
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(gateEvents)
        .where(gt(gateEvents.occurredAt, since24h)),

      // MRR breakdown by plan (active subs only)
      db
        .select({
          planSlug:     subscriptions.planSlug,
          planName:     plans.name,
          priceMonthly: plans.priceMonthly,
          count:        sql<number>`COUNT(*)::int`,
        })
        .from(subscriptions)
        .innerJoin(plans, eq(subscriptions.planSlug, plans.slug))
        .where(eq(subscriptions.status, "active"))
        .groupBy(subscriptions.planSlug, plans.name, plans.priceMonthly),

      // Alerts: past_due OR trial ending within 7 days (using latest sub per publisher)
      db.execute<{ id: string; name: string; status: string; current_period_end: Date | null }>(sql`
        SELECT DISTINCT ON (s.publisher_id)
          pub.id,
          pub.name,
          s.status,
          s.current_period_end
        FROM subscriptions s
        JOIN publishers pub ON pub.id = s.publisher_id
        WHERE pub.deleted_at IS NULL
          AND (
            s.status = 'past_due'
            OR (
              s.status = 'trialing'
              AND s.current_period_end < ${in7days}
              AND s.current_period_end > NOW()
            )
          )
        ORDER BY s.publisher_id, s.created_at DESC
        LIMIT 10
      `),

      // Recent 5 publishers
      db
        .select({
          id:        publishers.id,
          name:      publishers.name,
          slug:      publishers.slug,
          createdAt: publishers.createdAt,
        })
        .from(publishers)
        .where(isNull(publishers.deletedAt))
        .orderBy(desc(publishers.createdAt))
        .limit(5),

      // Domain counts per publisher
      getDomainCountMap(),
    ])

  // Enrich recent publishers with subscription data
  const recentPubIds = recentRows.map(r => r.id)
  const subMap = await getLatestSubMap(recentPubIds)

  const typedAlerts = alertRows.rows

  return {
    activeMRR:        Number(mrrRows[0]?.total ?? 0),
    activePublishers: mrrByPlanRows.reduce((s, r) => s + Number(r.count), 0),
    trialingPublishers: typedAlerts.filter(a => a.status === "trialing").length,
    totalDomains:     Number(domainRows[0]?.count ?? 0),
    gateDecisions24h: Number(decisionsRows[0]?.count ?? 0),
    recentPublishers: recentRows.map(r => {
      const sub = subMap.get(r.id)
      return {
        ...r,
        planSlug:     sub?.plan_slug     ?? null,
        planName:     sub?.plan_name     ?? null,
        subStatus:    sub?.status        ?? null,
        priceMonthly: sub?.price_monthly ?? null,
        domainCount:  domainCountMap.get(r.id) ?? 0,
      }
    }),
    mrrByPlan: mrrByPlanRows.map(r => ({
      planSlug:     r.planSlug,
      planName:     r.planName,
      priceMonthly: r.priceMonthly ?? 0,
      count:        Number(r.count),
    })),
    alerts: typedAlerts.map(a => ({
      id:               a.id,
      name:             a.name,
      status:           a.status,
      currentPeriodEnd: a.current_period_end,
    })),
  }
}

// ─── Publisher list ───────────────────────────────────────────────────────────

export type AdminPublisherRow = {
  id: string
  name: string
  slug: string
  createdAt: Date
  planSlug: string | null
  planName: string | null
  subStatus: string | null
  priceMonthly: number | null
  domainCount: number
  memberCount: number
}

export async function listAllPublishers(): Promise<AdminPublisherRow[]> {
  const [allPubs, subMap, domainCountMap, memberCountMap] = await Promise.all([
    db
      .select({
        id:        publishers.id,
        name:      publishers.name,
        slug:      publishers.slug,
        createdAt: publishers.createdAt,
      })
      .from(publishers)
      .where(isNull(publishers.deletedAt))
      .orderBy(desc(publishers.createdAt)),
    getLatestSubMap(),
    getDomainCountMap(),
    getMemberCountMap(),
  ])

  return allPubs.map(p => {
    const sub = subMap.get(p.id)
    return {
      ...p,
      planSlug:     sub?.plan_slug     ?? null,
      planName:     sub?.plan_name     ?? null,
      subStatus:    sub?.status        ?? null,
      priceMonthly: sub?.price_monthly ?? null,
      domainCount:  domainCountMap.get(p.id) ?? 0,
      memberCount:  memberCountMap.get(p.id) ?? 0,
    }
  })
}

// ─── Publisher detail ─────────────────────────────────────────────────────────

export type AdminPublisherDetail = {
  id: string
  name: string
  slug: string
  createdAt: Date
  planSlug: string | null
  planName: string | null
  subStatus: string | null
  priceMonthly: number | null
  domains: {
    id: string
    domain: string
    status: string
    gateCount: number
    lastPingAt: Date | null
  }[]
  members: {
    userId: string
    name: string
    email: string
    role: string
    joinedAt: Date
  }[]
}

export async function getPublisherDetail(publisherId: string): Promise<AdminPublisherDetail | null> {
  const [pub] = await db
    .select()
    .from(publishers)
    .where(and(eq(publishers.id, publisherId), isNull(publishers.deletedAt)))
    .limit(1)

  if (!pub) return null

  const [domainRows, memberRows, subRows, gateCountRows, lastPingRows] = await Promise.all([
    db
      .select({ id: domains.id, domain: domains.domain, status: domains.status })
      .from(domains)
      .where(and(eq(domains.publisherId, publisherId), isNull(domains.deletedAt)))
      .orderBy(domains.createdAt),

    db
      .select({
        userId:   publisherMembers.userId,
        name:     users.name,
        email:    users.email,
        role:     publisherMembers.role,
        joinedAt: publisherMembers.joinedAt,
      })
      .from(publisherMembers)
      .innerJoin(users, eq(publisherMembers.userId, users.id))
      .where(eq(publisherMembers.publisherId, publisherId))
      .orderBy(publisherMembers.joinedAt),

    // Latest subscription for this publisher
    db
      .select({
        planSlug:     subscriptions.planSlug,
        planName:     plans.name,
        status:       subscriptions.status,
        priceMonthly: plans.priceMonthly,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planSlug, plans.slug))
      .where(eq(subscriptions.publisherId, publisherId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1),

    // Gate counts per domain for this publisher
    db
      .select({
        domainId: gates.domainId,
        count:    sql<number>`COUNT(*)::int`,
      })
      .from(gates)
      .innerJoin(domains, eq(gates.domainId, domains.id))
      .where(and(eq(domains.publisherId, publisherId), isNull(gates.deletedAt)))
      .groupBy(gates.domainId),

    // Last ping (most recent gate event) per domain for this publisher
    db
      .select({
        domainId:   gateEvents.domainId,
        lastPingAt: sql<Date | null>`MAX(${gateEvents.occurredAt})`,
      })
      .from(gateEvents)
      .innerJoin(domains, eq(gateEvents.domainId, domains.id))
      .where(eq(domains.publisherId, publisherId))
      .groupBy(gateEvents.domainId),
  ])

  const gateCountByDomain = new Map(gateCountRows.map(r => [r.domainId, Number(r.count)]))
  const lastPingByDomain  = new Map(lastPingRows.map(r => [r.domainId, r.lastPingAt]))

  return {
    id:           pub.id,
    name:         pub.name,
    slug:         pub.slug,
    createdAt:    pub.createdAt,
    planSlug:     subRows[0]?.planSlug     ?? null,
    planName:     subRows[0]?.planName     ?? null,
    subStatus:    subRows[0]?.status       ?? null,
    priceMonthly: subRows[0]?.priceMonthly ?? null,
    domains:      domainRows.map(d => ({
      id:         d.id,
      domain:     d.domain,
      status:     d.status,
      gateCount:  gateCountByDomain.get(d.id) ?? 0,
      lastPingAt: lastPingByDomain.get(d.id) ?? null,
    })),
    members: memberRows,
  }
}

// ─── Subscription list ────────────────────────────────────────────────────────

export type AdminSubscriptionRow = {
  id: string
  publisherId: string
  publisherName: string
  publisherSlug: string
  planSlug: string
  planName: string
  priceMonthly: number | null
  status: string
  currentPeriodEnd: Date | null
  razorpaySubId: string | null
  createdAt: Date
}

export async function listAllSubscriptions(): Promise<AdminSubscriptionRow[]> {
  const rows = await db
    .select({
      id:               subscriptions.id,
      publisherId:      subscriptions.publisherId,
      publisherName:    publishers.name,
      publisherSlug:    publishers.slug,
      planSlug:         subscriptions.planSlug,
      planName:         plans.name,
      priceMonthly:     plans.priceMonthly,
      status:           subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      razorpaySubId:    subscriptions.razorpaySubId,
      createdAt:        subscriptions.createdAt,
    })
    .from(subscriptions)
    .innerJoin(publishers, eq(subscriptions.publisherId, publishers.id))
    .innerJoin(plans, eq(subscriptions.planSlug, plans.slug))
    .where(isNull(publishers.deletedAt))
    .orderBy(desc(subscriptions.createdAt))

  return rows
}

// ─── Domain health snapshot ───────────────────────────────────────────────────

export type DomainHealthRow = {
  id: string
  domain: string
  publisherName: string
  planSlug: string | null
  domainStatus: "active" | "paused" | "removed"
  lastPingAt: Date | null
  callsToday: number
  healthStatus: "ok" | "degraded" | "down" | "paused"
}

export async function getDomainsHealth(): Promise<DomainHealthRow[]> {
  const since24h = new Date(Date.now() - 86_400_000)
  const since1h  = new Date(Date.now() - 3_600_000)

  type DRow = { id: string; domain: string; status: string; publisher_name: string; plan_slug: string | null }

  const [domainRows, pingRows, callRows] = await Promise.all([
    db.execute<DRow>(sql`
      SELECT
        d.id,
        d.domain,
        d.status,
        pub.name AS publisher_name,
        sub.plan_slug
      FROM domains d
      JOIN publishers pub ON pub.id = d.publisher_id
      LEFT JOIN LATERAL (
        SELECT plan_slug FROM subscriptions
        WHERE publisher_id = d.publisher_id
        ORDER BY created_at DESC LIMIT 1
      ) sub ON true
      WHERE d.deleted_at IS NULL
        AND pub.deleted_at IS NULL
      ORDER BY d.created_at DESC
    `),

    db
      .select({
        domainId:   gateEvents.domainId,
        lastPingAt: sql<Date | null>`MAX(${gateEvents.occurredAt})`,
      })
      .from(gateEvents)
      .groupBy(gateEvents.domainId),

    db
      .select({
        domainId:   gateEvents.domainId,
        callsToday: sql<number>`COUNT(*)::int`,
      })
      .from(gateEvents)
      .where(gt(gateEvents.occurredAt, since24h))
      .groupBy(gateEvents.domainId),
  ])

  const lastPingMap   = new Map(pingRows.map(r => [r.domainId, r.lastPingAt]))
  const callsTodayMap = new Map(callRows.map(r => [r.domainId, Number(r.callsToday)]))

  return domainRows.rows.map(d => {
    const lastPingAt  = lastPingMap.get(d.id) ?? null
    const callsToday  = callsTodayMap.get(d.id) ?? 0
    const domainStatus = d.status as "active" | "paused" | "removed"

    let healthStatus: DomainHealthRow["healthStatus"]
    if (domainStatus === "paused")     healthStatus = "paused"
    else if (!lastPingAt)              healthStatus = "down"
    else if (lastPingAt >= since1h)    healthStatus = "ok"
    else if (lastPingAt >= since24h)   healthStatus = "degraded"
    else                               healthStatus = "down"

    return { id: d.id, domain: d.domain, publisherName: d.publisher_name, planSlug: d.plan_slug ?? null, domainStatus, lastPingAt, callsToday, healthStatus }
  })
}

// ─── Plans with live subscriber counts ───────────────────────────────────────

export type AdminPlanRow = {
  slug:                       string
  name:                       string
  priceMonthly:               number | null
  priceMonthlyUsd:            number | null
  commissionBps:              number
  byokAddonPriceInr:          number | null
  byokAddonPriceUsd:          number | null
  maxMonthlyGateTriggers:     number | null
  maxPayingSubscribers:       number | null
  subscriberOveragePriceInr:  number | null
  subscriberOveragePriceUsd:  number | null
  maxFreeAdImpressions:       number | null
  adOveragePricePerMilleInr:  number | null
  adOveragePricePerMilleUsd:  number | null
  maxGates:                   number | null
  active:                     boolean
  subscriberCount:            number
  activeMRR:                  number
  overageRevenueInr:          number
  overageRevenueUsd:          number
}

export async function getPlansWithStats(): Promise<AdminPlanRow[]> {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [planRows, subCountRows, overageRows] = await Promise.all([
    db.select().from(plans).orderBy(plans.priceMonthly),
    db
      .select({
        planSlug: subscriptions.planSlug,
        count:    sql<number>`COUNT(*)::int`,
      })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"))
      .groupBy(subscriptions.planSlug),
    // Per-plan overage revenue this calendar month (join latest sub to get plan slug)
    db.execute<{ plan_slug: string; currency: string; total: number }>(sql`
      SELECT DISTINCT ON (s.publisher_id)
        s.plan_slug,
        oc.currency,
        SUM(oc.total_amount) OVER (PARTITION BY s.plan_slug, oc.currency) AS total
      FROM publisher_overage_charges oc
      JOIN subscriptions s ON s.publisher_id = oc.publisher_id
      WHERE oc.created_at >= ${monthStart}
      ORDER BY s.publisher_id, s.created_at DESC
    `),
  ])

  const subCountMap = new Map(subCountRows.map(r => [r.planSlug, Number(r.count)]))

  // Aggregate overage per plan+currency
  const overageMap = new Map<string, { inr: number; usd: number }>()
  for (const r of overageRows.rows) {
    const key  = r.plan_slug
    const prev = overageMap.get(key) ?? { inr: 0, usd: 0 }
    if (r.currency === "USD") overageMap.set(key, { ...prev, usd: prev.usd + Number(r.total) })
    else                      overageMap.set(key, { ...prev, inr: prev.inr + Number(r.total) })
  }

  return planRows.map(p => {
    const subscriberCount = subCountMap.get(p.slug) ?? 0
    const overage         = overageMap.get(p.slug) ?? { inr: 0, usd: 0 }
    return {
      slug:                      p.slug,
      name:                      p.name,
      priceMonthly:              p.priceMonthly,
      priceMonthlyUsd:           p.priceMonthlyUsd ?? null,
      commissionBps:             p.commissionBps ?? 0,
      byokAddonPriceInr:         p.byokAddonPriceInr ?? null,
      byokAddonPriceUsd:         p.byokAddonPriceUsd ?? null,
      maxMonthlyGateTriggers:    p.maxMonthlyGateTriggers ?? null,
      maxPayingSubscribers:      p.maxPayingSubscribers ?? null,
      subscriberOveragePriceInr: p.subscriberOveragePriceInr ?? null,
      subscriberOveragePriceUsd: p.subscriberOveragePriceUsd ?? null,
      maxFreeAdImpressions:      p.maxFreeAdImpressions ?? null,
      adOveragePricePerMilleInr: p.adOveragePricePerMilleInr ?? null,
      adOveragePricePerMilleUsd: p.adOveragePricePerMilleUsd ?? null,
      maxGates:                  p.maxGates,
      active:                    p.active,
      subscriberCount,
      activeMRR:                 (p.priceMonthly ?? 0) * subscriberCount,
      overageRevenueInr:         overage.inr,
      overageRevenueUsd:         overage.usd,
    }
  })
}
