import { and, count, desc, eq, gte, inArray, lt, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { domains, gateEvents, plans, publisherOverageCharges, readerSubscriptions, subscriptions } from "@/lib/db/schema"

export type PlanRow         = typeof plans.$inferSelect
export type SubscriptionRow = typeof subscriptions.$inferSelect
export type OverageChargeRow = typeof publisherOverageCharges.$inferSelect

export async function listActivePlans(): Promise<PlanRow[]> {
  return db
    .select()
    .from(plans)
    .where(eq(plans.active, true))
    .orderBy(plans.priceMonthly)
}

export async function getPlan(slug: PlanRow["slug"]): Promise<PlanRow | null> {
  const [row] = await db.select().from(plans).where(eq(plans.slug, slug)).limit(1)
  return row ?? null
}

// The publisher's current subscription. Only one is ever active at a time;
// older cancelled rows stay for history. We pick the most-recent.
export async function getCurrentSubscription(publisherId: string): Promise<SubscriptionRow | null> {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.publisherId, publisherId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1)
  return row ?? null
}

export async function findSubscriptionByRazorpayId(razorpaySubId: string): Promise<SubscriptionRow | null> {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.razorpaySubId, razorpaySubId))
    .limit(1)
  return row ?? null
}

export async function createTrialSubscription(input: {
  publisherId: string
  planSlug:    PlanRow["slug"]
  trialDays:   number
}): Promise<SubscriptionRow> {
  const now = new Date()
  const trialEnd = new Date(now.getTime() + input.trialDays * 24 * 60 * 60 * 1000)
  const [row] = await db
    .insert(subscriptions)
    .values({
      publisherId:        input.publisherId,
      planSlug:           input.planSlug,
      status:             "trialing",
      currentPeriodStart: now,
      currentPeriodEnd:   trialEnd,
    })
    .returning()
  return row
}

export async function updateSubscription(id: string, patch: Partial<{
  planSlug:           PlanRow["slug"]
  status:             SubscriptionRow["status"]
  razorpaySubId:      string | null
  currentPeriodStart: Date | null
  currentPeriodEnd:   Date | null
  cancelledAt:        Date | null
  cancelAtCycleEnd:   boolean
  dunningStartedAt:   Date | null
  byokEnabled:        boolean
  billingInterval:    string
}>): Promise<SubscriptionRow> {
  const [row] = await db
    .update(subscriptions)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(subscriptions.id, id))
    .returning()
  return row
}

// Effective state for whether the publisher's gates / dashboard writes should
// be served. Honours all time-based rules without needing cron to have run.
export async function isPublisherActive(publisherId: string): Promise<boolean> {
  const sub = await getCurrentSubscription(publisherId)
  if (!sub) return false

  const now = Date.now()
  const periodEnd = sub.currentPeriodEnd?.getTime() ?? null

  switch (sub.status) {
    case "active":   return true
    case "past_due": return true   // within 7-day soft-suspension grace window
    case "trialing": return periodEnd != null && periodEnd > now
    case "cancelled": return periodEnd != null && periodEnd > now
    case "suspended": return false
  }
}

// ─── Publisher limits ────────────────────────────────────────────────────────

export type PublisherLimits = {
  planSlug:        PlanRow["slug"]
  planName:        string
  // Legacy / gate-level limits
  maxBrands:       number | null
  maxDomains:      number | null
  maxGates:        number | null
  maxMauPerDomain: number | null   // deprecated, kept for reference
  // v2 pricing limits
  maxMonthlyGateTriggers:    number | null
  maxPayingSubscribers:      number | null
  subscriberOveragePriceInr: number | null
  subscriberOveragePriceUsd: number | null
  maxFreeAdImpressions:      number | null
  adOveragePricePerMilleInr: number | null
  adOveragePricePerMilleUsd: number | null
  commissionBps:             number
  byokAddonPriceInr:         number | null
  byokAddonPriceUsd:         number | null
  // Subscription state
  byokEnabled:      boolean
  billingInterval:  string
}

export async function getPublisherLimits(publisherId: string): Promise<PublisherLimits | null> {
  const sub = await getCurrentSubscription(publisherId)
  if (!sub) return null
  const plan = await getPlan(sub.planSlug)
  if (!plan) return null
  return {
    planSlug:        plan.slug,
    planName:        plan.name,
    maxBrands:       plan.maxBrands ?? null,
    maxDomains:      plan.maxDomains,
    maxGates:        plan.maxGates,
    maxMauPerDomain: plan.maxMauPerDomain,
    maxMonthlyGateTriggers:    plan.maxMonthlyGateTriggers ?? null,
    maxPayingSubscribers:      plan.maxPayingSubscribers ?? null,
    subscriberOveragePriceInr: plan.subscriberOveragePriceInr ?? null,
    subscriberOveragePriceUsd: plan.subscriberOveragePriceUsd ?? null,
    maxFreeAdImpressions:      plan.maxFreeAdImpressions ?? null,
    adOveragePricePerMilleInr: plan.adOveragePricePerMilleInr ?? null,
    adOveragePricePerMilleUsd: plan.adOveragePricePerMilleUsd ?? null,
    commissionBps:             plan.commissionBps,
    byokAddonPriceInr:         plan.byokAddonPriceInr ?? null,
    byokAddonPriceUsd:         plan.byokAddonPriceUsd ?? null,
    byokEnabled:     sub.byokEnabled,
    billingInterval: sub.billingInterval,
  }
}

// ─── Usage counters ──────────────────────────────────────────────────────────

// Count active paying reader subscriptions for a publisher (seat quota check).
export async function getPublisherPayingSubscriberCount(publisherId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(readerSubscriptions)
    .where(and(
      eq(readerSubscriptions.publisherId, publisherId),
      inArray(readerSubscriptions.status, ["active", "past_due"]),
    ))
  return Number(row?.n ?? 0)
}

// Count bot-filtered gate_shown events for a publisher within a time window.
// Gate triggers are per-publisher (across all their domains).
export async function getPublisherMonthlyGateTriggers(
  publisherId: string,
  periodStart: Date,
  periodEnd:   Date,
): Promise<number> {
  const pubDomains = await db
    .select({ id: domains.id })
    .from(domains)
    .where(eq(domains.publisherId, publisherId))
  if (pubDomains.length === 0) return 0

  const domainIds = pubDomains.map(d => d.id)
  const [row] = await db
    .select({ n: count() })
    .from(gateEvents)
    .where(and(
      inArray(gateEvents.domainId, domainIds),
      eq(gateEvents.eventType, "gate_shown"),
      gte(gateEvents.occurredAt, periodStart),
      lt(gateEvents.occurredAt, periodEnd),
    ))
  return Number(row?.n ?? 0)
}

// Count ad_start events for impression billing within a billing period.
export async function getPublisherMonthlyAdImpressions(
  publisherId: string,
  periodStart: Date,
  periodEnd:   Date,
): Promise<number> {
  const pubDomains = await db
    .select({ id: domains.id })
    .from(domains)
    .where(eq(domains.publisherId, publisherId))
  if (pubDomains.length === 0) return 0

  const domainIds = pubDomains.map(d => d.id)
  const [row] = await db
    .select({ n: count() })
    .from(gateEvents)
    .where(and(
      inArray(gateEvents.domainId, domainIds),
      eq(gateEvents.eventType, "ad_start"),
      gte(gateEvents.occurredAt, periodStart),
      lt(gateEvents.occurredAt, periodEnd),
    ))
  return Number(row?.n ?? 0)
}

// ─── Overage charges ─────────────────────────────────────────────────────────

export async function createOverageCharge(input: {
  publisherId:             string
  billingPeriodStart:      Date
  billingPeriodEnd:        Date
  payingSubscriberCount:   number
  subscriberOverageCount:  number
  subscriberOverageAmount: number
  adImpressionCount:       number
  adImpressionFreeQuota:   number
  adImpressionOverage:     number
  adImpressionAmount:      number
  totalAmount:             number
  currency:                string
}): Promise<OverageChargeRow> {
  const [row] = await db
    .insert(publisherOverageCharges)
    .values(input)
    .returning()
  return row
}

export async function listPublisherOverageCharges(publisherId: string): Promise<OverageChargeRow[]> {
  return db
    .select()
    .from(publisherOverageCharges)
    .where(eq(publisherOverageCharges.publisherId, publisherId))
    .orderBy(desc(publisherOverageCharges.createdAt))
}

// Sum of overage revenue by plan for the current calendar month (admin use).
export async function getMonthlyOverageRevenue(): Promise<{ currency: string; total: number }[]> {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const rows = await db
    .select({
      currency: publisherOverageCharges.currency,
      total:    sql<number>`SUM(${publisherOverageCharges.totalAmount})`,
    })
    .from(publisherOverageCharges)
    .where(gte(publisherOverageCharges.createdAt, monthStart))
    .groupBy(publisherOverageCharges.currency)

  return rows.map(r => ({ currency: r.currency, total: Number(r.total) }))
}
