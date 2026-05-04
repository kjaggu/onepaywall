import { NextRequest, NextResponse } from "next/server"
import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { domains, plans, subscriptions } from "@/lib/db/schema"
import { updateDomain } from "@/lib/db/queries/domains"
import {
  createOverageCharge,
  getPublisherMonthlyAdImpressions,
  getPublisherMonthlyGateTriggers,
  getPublisherPayingSubscriberCount,
} from "@/lib/db/queries/billing"

// Hourly cron: transitions subscriptions through time-based state machine
// and calculates usage-based overage charges at billing cycle end.
//
// 1. past_due → suspended after 7 days of failed dunning
// 2. trialing → suspended once current_period_end has passed
// 3. Gate trigger enforcement (replaces per-domain MAU):
//    - Count gate_shown events this calendar month per publisher
//    - Pause all publisher domains if > maxMonthlyGateTriggers + 7-day grace
// 4. Monthly overage calculation at billing cycle end:
//    - Subscriber seat overage
//    - Ad impression overage
//
// Schedule: see vercel.json (hourly).

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const OVERAGE_MIN_INR = 100_00   // ₹100 minimum before creating an overage charge (paise)
const OVERAGE_MIN_USD = 2_00     // $2 minimum (cents)

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  if (process.env.NODE_ENV === "production" && expected) {
    const provided = req.headers.get("authorization")
    if (provided !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS)

  // ── 1. past_due > 7 days → suspended ──────────────────────────────────────
  const dunningExpired = await db
    .update(subscriptions)
    .set({ status: "suspended", updatedAt: now })
    .where(and(
      eq(subscriptions.status, "past_due"),
      lt(subscriptions.dunningStartedAt, sevenDaysAgo),
    ))
    .returning({ id: subscriptions.id, publisherId: subscriptions.publisherId })

  // ── 2. trial expired → suspended ──────────────────────────────────────────
  const trialExpired = await db
    .update(subscriptions)
    .set({ status: "suspended", updatedAt: now })
    .where(and(
      eq(subscriptions.status, "trialing"),
      lt(subscriptions.currentPeriodEnd, now),
    ))
    .returning({ id: subscriptions.id, publisherId: subscriptions.publisherId })

  // ── 3. Gate trigger enforcement (per publisher) ────────────────────────────
  type TriggerRow = { publisher_id: string; max_monthly_gate_triggers: number }
  const triggerLimitedSubs = await db.execute<TriggerRow>(sql`
    SELECT DISTINCT ON (s.publisher_id)
      s.publisher_id,
      p.max_monthly_gate_triggers
    FROM subscriptions s
    JOIN plans p ON p.slug = s.plan_slug
    WHERE s.status IN ('active', 'trialing')
      AND p.max_monthly_gate_triggers IS NOT NULL
    ORDER BY s.publisher_id, s.created_at DESC
  `)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  let gateTriggerOverLimit = 0

  for (const row of triggerLimitedSubs.rows) {
    const triggers = await getPublisherMonthlyGateTriggers(row.publisher_id, monthStart, now)
    const limit = row.max_monthly_gate_triggers

    if (triggers > limit) {
      // Pause all active domains for this publisher
      const pubDomains = await db
        .select({ id: domains.id, status: domains.status })
        .from(domains)
        .where(eq(domains.publisherId, row.publisher_id))

      for (const domain of pubDomains) {
        if (domain.status === "active") {
          await updateDomain(domain.id, row.publisher_id, { status: "paused" })
          gateTriggerOverLimit++
        }
      }
    } else if (triggers <= limit) {
      // Resume any domains paused for trigger overuse (not paused for other reasons)
      const pubDomains = await db
        .select({ id: domains.id, status: domains.status })
        .from(domains)
        .where(and(
          eq(domains.publisherId, row.publisher_id),
          eq(domains.status, "paused"),
        ))
      for (const domain of pubDomains) {
        await updateDomain(domain.id, row.publisher_id, { status: "active" })
      }
    }
  }

  // ── 4. Monthly overage charges (at billing cycle end) ─────────────────────
  // Run for subscriptions whose currentPeriodEnd is within the past 24 hours
  // (billing cycle just ended). Prevents double-calculation on subsequent runs.
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  type CycleEndRow = {
    publisher_id: string
    current_period_start: string
    current_period_end: string
    max_paying_subscribers: number | null
    subscriber_overage_price_inr: number | null
    subscriber_overage_price_usd: number | null
    max_free_ad_impressions: number | null
    ad_overage_price_per_mille_inr: number | null
    ad_overage_price_per_mille_usd: number | null
    currency: string
  }

  const cycleEndSubs = await db.execute<CycleEndRow>(sql`
    SELECT DISTINCT ON (s.publisher_id)
      s.publisher_id,
      s.current_period_start,
      s.current_period_end,
      p.max_paying_subscribers,
      p.subscriber_overage_price_inr,
      p.subscriber_overage_price_usd,
      p.max_free_ad_impressions,
      p.ad_overage_price_per_mille_inr,
      p.ad_overage_price_per_mille_usd,
      pub.currency
    FROM subscriptions s
    JOIN plans p ON p.slug = s.plan_slug
    JOIN publishers pub ON pub.id = s.publisher_id
    WHERE s.status IN ('active', 'past_due')
      AND s.current_period_end >= ${oneDayAgo}
      AND s.current_period_end <= ${now}
      AND (
        p.max_paying_subscribers IS NOT NULL
        OR p.max_free_ad_impressions IS NOT NULL
      )
    ORDER BY s.publisher_id, s.created_at DESC
  `)

  let overageChargesCreated = 0

  for (const row of cycleEndSubs.rows) {
    const periodStart = new Date(row.current_period_start)
    const periodEnd   = new Date(row.current_period_end)
    const currency    = row.currency ?? "INR"
    const isInr       = currency === "INR"

    // Subscriber seat overage
    const subscriberCount  = await getPublisherPayingSubscriberCount(row.publisher_id)
    const subscriberQuota  = row.max_paying_subscribers ?? Infinity
    const subscriberOver   = Math.max(0, subscriberCount - subscriberQuota)
    const subOveragePrice  = isInr
      ? (row.subscriber_overage_price_inr ?? 0)
      : (row.subscriber_overage_price_usd ?? 0)
    const subscriberAmount = subscriberOver * subOveragePrice

    // Ad impression overage
    const adCount      = await getPublisherMonthlyAdImpressions(row.publisher_id, periodStart, periodEnd)
    const adFreeQuota  = row.max_free_ad_impressions ?? Infinity
    const adOver       = Math.max(0, adCount - adFreeQuota)
    const adMillePrice = isInr
      ? (row.ad_overage_price_per_mille_inr ?? 0)
      : (row.ad_overage_price_per_mille_usd ?? 0)
    const adAmount     = Math.floor((adOver / 1000) * adMillePrice)

    const totalAmount = subscriberAmount + adAmount
    const minCharge   = isInr ? OVERAGE_MIN_INR : OVERAGE_MIN_USD

    if (totalAmount < minCharge) continue

    await createOverageCharge({
      publisherId:             row.publisher_id,
      billingPeriodStart:      periodStart,
      billingPeriodEnd:        periodEnd,
      payingSubscriberCount:   subscriberCount,
      subscriberOverageCount:  subscriberOver,
      subscriberOverageAmount: subscriberAmount,
      adImpressionCount:       adCount,
      adImpressionFreeQuota:   row.max_free_ad_impressions ?? 0,
      adImpressionOverage:     adOver,
      adImpressionAmount:      adAmount,
      totalAmount,
      currency,
    })
    overageChargesCreated++
  }

  return NextResponse.json({
    ranAt:                now.toISOString(),
    dunningExpired:       dunningExpired.length,
    trialExpired:         trialExpired.length,
    gateTriggerOverLimit,
    overageChargesCreated,
  })
}
