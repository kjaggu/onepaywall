import { db } from "@/lib/db/client"
import { publisherReaderPlans, publisherContentPrices, publishers } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { createReaderRazorpayPlan } from "@/lib/payments/readerSubscriptions"
import { getOrCreatePgConfig } from "@/lib/db/queries/pg-configs"

type Interval = "monthly" | "quarterly" | "annual"
type SyncState = "not_configured" | "synced" | "needs_resync" | "error"
export type ReaderPlanSyncStatus = Record<Interval, SyncState>

const INTERVALS: Array<{
  key: Interval
  priceField: "monthlyPrice" | "quarterlyPrice" | "annualPrice"
  planIdField: "monthlyRazorpayPlanId" | "quarterlyRazorpayPlanId" | "annualRazorpayPlanId"
  syncedPriceField: "monthlySyncedPrice" | "quarterlySyncedPrice" | "annualSyncedPrice"
  syncedCurrencyField: "monthlySyncedCurrency" | "quarterlySyncedCurrency" | "annualSyncedCurrency"
  syncedModeField: "monthlySyncedPgMode" | "quarterlySyncedPgMode" | "annualSyncedPgMode"
  syncedAtField: "monthlySyncedAt" | "quarterlySyncedAt" | "annualSyncedAt"
  errorField: "monthlySyncError" | "quarterlySyncError" | "annualSyncError"
}> = [
  {
    key: "monthly",
    priceField: "monthlyPrice",
    planIdField: "monthlyRazorpayPlanId",
    syncedPriceField: "monthlySyncedPrice",
    syncedCurrencyField: "monthlySyncedCurrency",
    syncedModeField: "monthlySyncedPgMode",
    syncedAtField: "monthlySyncedAt",
    errorField: "monthlySyncError",
  },
  {
    key: "quarterly",
    priceField: "quarterlyPrice",
    planIdField: "quarterlyRazorpayPlanId",
    syncedPriceField: "quarterlySyncedPrice",
    syncedCurrencyField: "quarterlySyncedCurrency",
    syncedModeField: "quarterlySyncedPgMode",
    syncedAtField: "quarterlySyncedAt",
    errorField: "quarterlySyncError",
  },
  {
    key: "annual",
    priceField: "annualPrice",
    planIdField: "annualRazorpayPlanId",
    syncedPriceField: "annualSyncedPrice",
    syncedCurrencyField: "annualSyncedCurrency",
    syncedModeField: "annualSyncedPgMode",
    syncedAtField: "annualSyncedAt",
    errorField: "annualSyncError",
  },
]

export async function getPublisherReaderPlan(brandId: string) {
  const [row] = await db
    .select()
    .from(publisherReaderPlans)
    .where(eq(publisherReaderPlans.brandId, brandId))
  return row ?? null
}

export async function upsertPublisherReaderPlan(brandId: string, publisherId: string, data: {
  currency?: string
  monthlyPrice?: number | null
  quarterlyPrice?: number | null
  annualPrice?: number | null
  subsEnabled?: boolean
  defaultUnlockPrice?: number | null
  unlockEnabled?: boolean
}) {
  const existing = await getPublisherReaderPlan(brandId)
  if (existing) {
    const [row] = await db
      .update(publisherReaderPlans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(publisherReaderPlans.brandId, brandId))
      .returning()
    return row
  } else {
    const [row] = await db
      .insert(publisherReaderPlans)
      .values({ brandId, publisherId, ...data })
      .returning()
    return row
  }
}

export function getReaderPlanSyncStatus(plan: Awaited<ReturnType<typeof getPublisherReaderPlan>>, currentPgMode?: "platform" | "own" | "manual") {
  if (!plan) return { monthly: "not_configured", quarterly: "not_configured", annual: "not_configured" } satisfies ReaderPlanSyncStatus
  return Object.fromEntries(INTERVALS.map(i => {
    const price = plan[i.priceField]
    if (!price) return [i.key, "not_configured"]
    if (plan[i.errorField]) return [i.key, "error"]
    if (
      plan[i.planIdField] &&
      plan[i.syncedPriceField] === price &&
      plan[i.syncedCurrencyField] === plan.currency &&
      plan[i.syncedModeField] &&
      (!currentPgMode || plan[i.syncedModeField] === currentPgMode)
    ) return [i.key, "synced"]
    return [i.key, "needs_resync"]
  })) as ReaderPlanSyncStatus
}

export async function syncPublisherReaderSubscriptionPlans(brandId: string, publisherId: string) {
  const plan = await getPublisherReaderPlan(brandId)
  if (!plan || !plan.subsEnabled) return plan

  const [publisher] = await db
    .select({ name: publishers.name })
    .from(publishers)
    .where(eq(publishers.id, publisherId))
    .limit(1)
  const publisherName = publisher?.name ?? "Publisher"
  const currentPgMode = (await getOrCreatePgConfig(brandId, publisherId)).mode

  let latest = plan
  for (const i of INTERVALS) {
    const price = latest[i.priceField]
    if (!price || price <= 0) continue

    const alreadySynced =
      latest[i.planIdField] &&
      latest[i.syncedPriceField] === price &&
      latest[i.syncedCurrencyField] === latest.currency &&
      latest[i.syncedModeField] === currentPgMode

    if (alreadySynced) continue

    try {
      const synced = await createReaderRazorpayPlan({
        publisherId,
        publisherName,
        interval: i.key,
        amount: price,
        currency: latest.currency,
      })
      const [row] = await db
        .update(publisherReaderPlans)
        .set({
          [i.planIdField]: synced.planId,
          [i.syncedPriceField]: price,
          [i.syncedCurrencyField]: latest.currency,
          [i.syncedModeField]: synced.pgMode,
          [i.syncedAtField]: new Date(),
          [i.errorField]: null,
          updatedAt: new Date(),
        })
        .where(eq(publisherReaderPlans.brandId, brandId))
        .returning()
      latest = row
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not sync Razorpay plan"
      const [row] = await db
        .update(publisherReaderPlans)
        .set({
          [i.errorField]: message,
          updatedAt: new Date(),
        })
        .where(eq(publisherReaderPlans.brandId, brandId))
        .returning()
      latest = row
    }
  }

  return latest
}

export function getEnabledSyncedIntervals(plan: Awaited<ReturnType<typeof getPublisherReaderPlan>>, currentPgMode?: "platform" | "own" | "manual") {
  if (!plan?.subsEnabled) return []
  return INTERVALS.flatMap(i => {
    const price = plan[i.priceField]
    const planId = plan[i.planIdField]
    const status = getReaderPlanSyncStatus(plan, currentPgMode)[i.key]
    if (!price || !planId || status !== "synced") return []
    return [{
      interval: i.key,
      price,
      currency: plan.currency,
      razorpayPlanId: planId,
      pgMode: plan[i.syncedModeField],
    }]
  })
}

export async function listContentPrices(publisherId: string) {
  return db
    .select()
    .from(publisherContentPrices)
    .where(eq(publisherContentPrices.publisherId, publisherId))
    .orderBy(publisherContentPrices.createdAt)
}

export async function addContentPrice(publisherId: string, data: {
  urlPattern: string
  price: number
  label?: string
}) {
  const [row] = await db
    .insert(publisherContentPrices)
    .values({ publisherId, ...data })
    .returning()
  return row
}

export async function deleteContentPrice(id: string, publisherId: string) {
  await db
    .delete(publisherContentPrices)
    .where(and(
      eq(publisherContentPrices.id, id),
      eq(publisherContentPrices.publisherId, publisherId),
    ))
}
