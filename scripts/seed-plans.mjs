#!/usr/bin/env node
/**
 * Seed/refresh OnePaywall plan rows.
 *
 * Reads RAZORPAY_PLATFORM_PLAN_* env vars and upserts the matching `plans`
 * rows. Idempotent — re-running picks up price/limit changes you've made
 * here without duplicating anything.
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

// All prices in paise (Razorpay's smallest unit). Limits represent
// reasonable starting tiers — easy to change here, re-run the script.
const PLANS = [
  {
    slug:            "lite",
    name:            "Lite",
    priceMonthly:    1499_00,
    maxDomains:      1,
    maxMauPerDomain: 5_000,
    maxGates:        2,
    trialDays:       0,
    razorpayPlanId:  process.env.RAZORPAY_PLATFORM_PLAN_LITE ?? null,
  },
  {
    slug:            "starter",
    name:            "Starter",
    priceMonthly:    2999_00,
    maxDomains:      3,
    maxMauPerDomain: 25_000,
    maxGates:        5,
    trialDays:       14,
    razorpayPlanId:  process.env.RAZORPAY_PLATFORM_PLAN_STARTER ?? null,
  },
  {
    slug:            "growth",
    name:            "Growth",
    priceMonthly:    7999_00,
    maxDomains:      10,
    maxMauPerDomain: 100_000,
    maxGates:        20,
    trialDays:       0,
    razorpayPlanId:  process.env.RAZORPAY_PLATFORM_PLAN_GROWTH ?? null,
  },
  {
    slug:            "scale",
    name:            "Scale",
    priceMonthly:    19999_00,
    maxDomains:      null, // unlimited
    maxMauPerDomain: null, // unlimited
    maxGates:        null, // unlimited
    trialDays:       0,
    razorpayPlanId:  process.env.RAZORPAY_PLATFORM_PLAN_SCALE ?? null,
  },
]

async function main() {
  console.log("Seeding plans:")
  for (const p of PLANS) {
    if (!p.razorpayPlanId) {
      console.warn(`  ⚠ ${p.slug}: RAZORPAY_PLATFORM_PLAN_${p.slug.toUpperCase()} not set — skipping razorpay_plan_id`)
    }

    await sql`
      INSERT INTO plans (slug, name, price_monthly, max_domains, max_mau_per_domain, max_gates, trial_days, active, razorpay_plan_id)
      VALUES (${p.slug}, ${p.name}, ${p.priceMonthly}, ${p.maxDomains}, ${p.maxMauPerDomain}, ${p.maxGates}, ${p.trialDays}, true, ${p.razorpayPlanId})
      ON CONFLICT (slug) DO UPDATE SET
        name               = EXCLUDED.name,
        price_monthly      = EXCLUDED.price_monthly,
        max_domains        = EXCLUDED.max_domains,
        max_mau_per_domain = EXCLUDED.max_mau_per_domain,
        max_gates          = EXCLUDED.max_gates,
        trial_days         = EXCLUDED.trial_days,
        active             = EXCLUDED.active,
        razorpay_plan_id   = COALESCE(EXCLUDED.razorpay_plan_id, plans.razorpay_plan_id)
    `

    const idTag = p.razorpayPlanId ? `→ ${p.razorpayPlanId}` : "(no razorpay id)"
    console.log(`  ✓ ${p.slug.padEnd(8)} ₹${(p.priceMonthly / 100).toLocaleString("en-IN")}/mo ${idTag}`)
  }
  console.log("\nDone.")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => sql.end())
