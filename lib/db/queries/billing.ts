import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { plans, subscriptions } from "@/lib/db/schema"

export type PlanRow = typeof plans.$inferSelect
export type SubscriptionRow = typeof subscriptions.$inferSelect

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
// older cancelled rows stay in the table for history. We pick the most-recent.
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
}>): Promise<SubscriptionRow> {
  const [row] = await db
    .update(subscriptions)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(subscriptions.id, id))
    .returning()
  return row
}

// Effective state for whether the publisher's gates / dashboard writes should
// be served. Honours all the time-based rules without needing the cron to
// have run yet (defensive — if cron is delayed, request-time check still
// returns the right answer).
export async function isPublisherActive(publisherId: string): Promise<boolean> {
  const sub = await getCurrentSubscription(publisherId)
  if (!sub) return false

  const now = Date.now()
  const periodEnd = sub.currentPeriodEnd?.getTime() ?? null

  switch (sub.status) {
    case "active":
      return true
    case "past_due":
      // Within the 7-day soft-suspension grace window. The cron flips
      // dunning_started_at + 7d → suspended.
      return true
    case "trialing":
      return periodEnd != null && periodEnd > now
    case "cancelled":
      return periodEnd != null && periodEnd > now
    case "suspended":
      return false
  }
}

// Plan limits for a publisher's current subscription. Returns null if no sub
// exists; null limit fields = unlimited (Scale tier).
export type PublisherLimits = {
  planSlug:        PlanRow["slug"]
  planName:        string
  maxBrands:       number | null
  maxDomains:      number | null  // per-brand domain limit (hardcoded 3, kept for reference)
  maxGates:        number | null
  maxMauPerDomain: number | null
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
  }
}
