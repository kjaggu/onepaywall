#!/usr/bin/env node
/**
 * Seed/refresh OnePaywall plan rows.
 *
 * Upserts all plan rows with the v2 pricing model:
 *   - INR + USD base prices
 *   - Commission basis points (platform-PG reader transactions)
 *   - BYOK addon prices
 *   - Gate trigger quota (replaces per-domain MAU)
 *   - Subscriber seat quota + overage pricing
 *   - Ad impression free tier + overage pricing
 *
 * All INR amounts in paise; all USD amounts in cents.
 * Idempotent — safe to re-run any time prices/limits change.
 *
 * Usage:
 *   npm run db:seed:plans
 */
import postgres from "postgres"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL is not set. Did you forget --env-file=.env.local ?")
  process.exit(1)
}

const sql = postgres(url, { max: 1, idle_timeout: 5, prepare: false, onnotice: () => {} })

const PLANS = [
  {
    slug:            "lite",
    name:            "Lite",
    // Base prices
    priceMonthly:    2999_00,     // ₹2,999/month in paise
    priceMonthlyUsd: 29_00,       // $29/month in cents
    // Commission: 4% on platform-PG reader transactions
    commissionBps:   400,
    // BYOK addon (~50% of base fee)
    byokAddonPriceInr: 1499_00,
    byokAddonPriceUsd: 15_00,
    // Gate trigger quota (bot-filtered gate_shown events/month)
    maxMonthlyGateTriggers: 10_000,
    // Domains / gates
    maxDomains: null,             // unlimited
    maxGates:   5,
    // Trial
    trialDays:  14,
    // Subscriber seats
    maxPayingSubscribers:       250,
    subscriberOveragePriceInr:  8_00,   // ₹8/subscriber/month
    subscriberOveragePriceUsd:  10,     // $0.10/subscriber/month
    // Ad impressions: 10K free, then ₹15/$0.20 per 1K
    maxFreeAdImpressions:       10_000,
    adOveragePricePerMilleInr:  1500,   // ₹15 per 1,000 (in paise)
    adOveragePricePerMilleUsd:  20,     // $0.20 per 1,000 (in cents)
    // Razorpay plan IDs (from env)
    razorpayPlanId:    process.env.RAZORPAY_PLATFORM_PLAN_LITE    ?? null,
    razorpayPlanIdUsd: process.env.RAZORPAY_PLATFORM_PLAN_LITE_USD ?? null,
  },
  {
    slug:            "starter",
    name:            "Starter",
    priceMonthly:    7499_00,     // ₹7,499/month
    priceMonthlyUsd: 79_00,       // $79/month
    commissionBps:   300,         // 3%
    byokAddonPriceInr: 3999_00,
    byokAddonPriceUsd: 39_00,
    maxMonthlyGateTriggers: 50_000,
    maxDomains: null,
    maxGates:   20,
    trialDays:  14,
    maxPayingSubscribers:       1500,
    subscriberOveragePriceInr:  5_00,   // ₹5/subscriber/month
    subscriberOveragePriceUsd:  6,      // $0.06/subscriber/month
    maxFreeAdImpressions:       50_000,
    adOveragePricePerMilleInr:  1200,   // ₹12 per 1,000
    adOveragePricePerMilleUsd:  15,     // $0.15 per 1,000
    razorpayPlanId:    process.env.RAZORPAY_PLATFORM_PLAN_STARTER    ?? null,
    razorpayPlanIdUsd: process.env.RAZORPAY_PLATFORM_PLAN_STARTER_USD ?? null,
  },
  {
    slug:            "growth",
    name:            "Growth",
    priceMonthly:    18999_00,    // ₹18,999/month
    priceMonthlyUsd: 199_00,      // $199/month
    commissionBps:   200,         // 2%
    byokAddonPriceInr: 9999_00,
    byokAddonPriceUsd: 99_00,
    maxMonthlyGateTriggers: 250_000,
    maxDomains: null,
    maxGates:   null,             // unlimited
    trialDays:  0,
    maxPayingSubscribers:       10_000,
    subscriberOveragePriceInr:  3_00,   // ₹3/subscriber/month
    subscriberOveragePriceUsd:  4,      // $0.04/subscriber/month
    maxFreeAdImpressions:       200_000,
    adOveragePricePerMilleInr:  900,    // ₹9 per 1,000
    adOveragePricePerMilleUsd:  10,     // $0.10 per 1,000
    razorpayPlanId:    process.env.RAZORPAY_PLATFORM_PLAN_GROWTH    ?? null,
    razorpayPlanIdUsd: process.env.RAZORPAY_PLATFORM_PLAN_GROWTH_USD ?? null,
  },
  {
    slug:            "scale",
    name:            "Scale",
    priceMonthly:    49999_00,    // ₹49,999/month
    priceMonthlyUsd: 499_00,      // $499/month
    commissionBps:   150,         // 1.5%
    byokAddonPriceInr: 24999_00,
    byokAddonPriceUsd: 249_00,
    maxMonthlyGateTriggers: 1_000_000,
    maxDomains: null,
    maxGates:   null,
    trialDays:  0,
    maxPayingSubscribers:       null,   // unlimited
    subscriberOveragePriceInr:  null,
    subscriberOveragePriceUsd:  null,
    maxFreeAdImpressions:       null,   // unlimited
    adOveragePricePerMilleInr:  0,
    adOveragePricePerMilleUsd:  0,
    razorpayPlanId:    process.env.RAZORPAY_PLATFORM_PLAN_SCALE    ?? null,
    razorpayPlanIdUsd: process.env.RAZORPAY_PLATFORM_PLAN_SCALE_USD ?? null,
  },
]

async function main() {
  console.log("Seeding plans (v2 pricing):\n")

  for (const p of PLANS) {
    if (!p.razorpayPlanId) {
      console.warn(`  ⚠ ${p.slug}: RAZORPAY_PLATFORM_PLAN_${p.slug.toUpperCase()} not set`)
    }

    await sql`
      INSERT INTO plans (
        slug, name,
        price_monthly, price_monthly_usd,
        commission_bps,
        byok_addon_price_inr, byok_addon_price_usd,
        max_monthly_gate_triggers,
        max_domains, max_gates, trial_days, active,
        razorpay_plan_id, razorpay_plan_id_usd,
        max_paying_subscribers,
        subscriber_overage_price_inr, subscriber_overage_price_usd,
        max_free_ad_impressions,
        ad_overage_price_per_mille_inr, ad_overage_price_per_mille_usd
      )
      VALUES (
        ${p.slug}, ${p.name},
        ${p.priceMonthly}, ${p.priceMonthlyUsd},
        ${p.commissionBps},
        ${p.byokAddonPriceInr}, ${p.byokAddonPriceUsd},
        ${p.maxMonthlyGateTriggers},
        ${p.maxDomains}, ${p.maxGates}, ${p.trialDays}, true,
        ${p.razorpayPlanId}, ${p.razorpayPlanIdUsd},
        ${p.maxPayingSubscribers},
        ${p.subscriberOveragePriceInr}, ${p.subscriberOveragePriceUsd},
        ${p.maxFreeAdImpressions},
        ${p.adOveragePricePerMilleInr}, ${p.adOveragePricePerMilleUsd}
      )
      ON CONFLICT (slug) DO UPDATE SET
        name                          = EXCLUDED.name,
        price_monthly                 = EXCLUDED.price_monthly,
        price_monthly_usd             = EXCLUDED.price_monthly_usd,
        commission_bps                = EXCLUDED.commission_bps,
        byok_addon_price_inr          = EXCLUDED.byok_addon_price_inr,
        byok_addon_price_usd          = EXCLUDED.byok_addon_price_usd,
        max_monthly_gate_triggers     = EXCLUDED.max_monthly_gate_triggers,
        max_domains                   = EXCLUDED.max_domains,
        max_gates                     = EXCLUDED.max_gates,
        trial_days                    = EXCLUDED.trial_days,
        active                        = EXCLUDED.active,
        razorpay_plan_id              = COALESCE(EXCLUDED.razorpay_plan_id, plans.razorpay_plan_id),
        razorpay_plan_id_usd          = COALESCE(EXCLUDED.razorpay_plan_id_usd, plans.razorpay_plan_id_usd),
        max_paying_subscribers        = EXCLUDED.max_paying_subscribers,
        subscriber_overage_price_inr  = EXCLUDED.subscriber_overage_price_inr,
        subscriber_overage_price_usd  = EXCLUDED.subscriber_overage_price_usd,
        max_free_ad_impressions       = EXCLUDED.max_free_ad_impressions,
        ad_overage_price_per_mille_inr = EXCLUDED.ad_overage_price_per_mille_inr,
        ad_overage_price_per_mille_usd = EXCLUDED.ad_overage_price_per_mille_usd
    `

    const inr = `₹${(p.priceMonthly / 100).toLocaleString("en-IN")}/mo`
    const usd = `$${(p.priceMonthlyUsd / 100)}/mo`
    const commission = `${p.commissionBps / 100}% commission`
    const triggers = p.maxMonthlyGateTriggers
      ? `${p.maxMonthlyGateTriggers.toLocaleString("en-IN")} triggers`
      : "unlimited triggers"
    console.log(`  ✓ ${p.slug.padEnd(8)} ${inr} / ${usd}  |  ${commission}  |  ${triggers}`)
  }

  console.log("\nDone.")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => sql.end())
