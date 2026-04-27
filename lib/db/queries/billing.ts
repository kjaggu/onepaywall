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
