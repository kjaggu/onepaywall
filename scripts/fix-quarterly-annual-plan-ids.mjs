// One-time script: force-regenerate quarterly + annual Razorpay plans
// whose syncedDisplayName was set by the monthly sync before the bug fix,
// causing them to be skipped.
//
// Run: node --env-file=.env.local scripts/fix-quarterly-annual-plan-ids.mjs

import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { isNotNull, isNull, or } from "drizzle-orm"

const sql = neon(process.env.DATABASE_URL)
const db = drizzle(sql)

const { publisherReaderPlans } = await import("../lib/db/schema.ts")
const { syncPublisherReaderSubscriptionPlans } = await import("../lib/db/queries/publisher-plans.ts")
const { eq } = await import("drizzle-orm")

// Find plans where syncedDisplayName is already set (monthly ran) but
// quarterly or annual sync mode is still set — meaning they were skipped.
const plans = await db
  .select({
    id: publisherReaderPlans.id,
    brandId: publisherReaderPlans.brandId,
    publisherId: publisherReaderPlans.publisherId,
    syncedDisplayName: publisherReaderPlans.syncedDisplayName,
    quarterlySyncedPgMode: publisherReaderPlans.quarterlySyncedPgMode,
    annualSyncedPgMode: publisherReaderPlans.annualSyncedPgMode,
  })
  .from(publisherReaderPlans)
  .where(isNotNull(publisherReaderPlans.syncedDisplayName))

if (plans.length === 0) {
  console.log("No plans found with syncedDisplayName set — nothing to fix.")
  process.exit(0)
}

console.log(`Found ${plans.length} plan(s) to fix:`)
for (const p of plans) {
  console.log(`  brandId=${p.brandId} syncedDisplayName="${p.syncedDisplayName}"`)
}

// Null out quarterly and annual sync markers so the sync loop treats them as
// needing a new Razorpay plan.
for (const p of plans) {
  await db
    .update(publisherReaderPlans)
    .set({
      quarterlySyncedPgMode: null,
      annualSyncedPgMode: null,
      syncedDisplayName: null,   // reset so the bug-fixed loop handles all 3 cleanly
    })
    .where(eq(publisherReaderPlans.id, p.id))

  console.log(`\nSyncing brand ${p.brandId} ...`)
  const result = await syncPublisherReaderSubscriptionPlans(
    p.brandId ?? p.publisherId,
    p.publisherId,
  )
  console.log(`  monthly  plan: ${result?.monthlyRazorpayPlanId}`)
  console.log(`  quarterly plan: ${result?.quarterlyRazorpayPlanId}`)
  console.log(`  annual    plan: ${result?.annualRazorpayPlanId}`)
  console.log(`  syncedDisplayName: ${result?.syncedDisplayName}`)
}

console.log("\nDone.")
