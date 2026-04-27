#!/usr/bin/env node
/**
 * One-off integration check for Session 2c.
 * Flips the test publisher's subscription through past_due / suspended /
 * trial-expired states and confirms gate-check + cron behave correctly.
 * Reverts to trialing at the end so the dev environment is clean.
 *
 * Usage: node --env-file=.env.local scripts/verify-billing-enforcement.mjs
 */
import postgres from "postgres"

const url = process.env.DATABASE_URL
if (!url) { console.error("DATABASE_URL not set"); process.exit(1) }

const sql = postgres(url, { max: 1, idle_timeout: 5, prepare: false, onnotice: () => {} })

const APP = "http://localhost:3000"

async function setSubscription(publisherId, patch) {
  const sets = []
  const vals = {}
  for (const [k, v] of Object.entries(patch)) {
    sets.push(`${k} = ${"${" + k + "}"}`)
    vals[k] = v
  }
  // Build dynamic UPDATE — postgres library does not interpolate column names.
  const setClauses = Object.keys(patch).map((k, i) => `${k} = $${i + 1}`).join(", ")
  const args = Object.values(patch)
  await sql.unsafe(
    `UPDATE subscriptions SET ${setClauses}, updated_at = now() WHERE publisher_id = $${args.length + 1}`,
    [...args, publisherId],
  )
}

async function getSubscription(publisherId) {
  const rows = await sql`
    SELECT status, current_period_end, dunning_started_at, plan_slug
    FROM subscriptions
    WHERE publisher_id = ${publisherId}
    ORDER BY created_at DESC
    LIMIT 1
  `
  return rows[0]
}

async function gateCheck(siteKey) {
  const u = new URL(APP + "/api/embed/gate-check")
  u.searchParams.set("siteKey", siteKey)
  u.searchParams.set("clientId", "verify-script-" + Date.now())
  u.searchParams.set("url", "https://testpublication.com/sports/cricket/article-1/")
  u.searchParams.set("device", "desktop")
  const res = await fetch(u)
  return res.json()
}

async function runCron() {
  const res = await fetch(APP + "/api/cron/billing-enforcement")
  return res.json()
}

async function main() {
  // Find test publisher + their domain's site key.
  const [pub] = await sql`SELECT id FROM publishers ORDER BY created_at LIMIT 1`
  const [dom] = await sql`SELECT site_key FROM domains WHERE publisher_id = ${pub.id} ORDER BY created_at LIMIT 1`
  const publisherId = pub.id
  const siteKey = dom.site_key

  console.log(`Test publisher: ${publisherId}`)
  console.log(`Test domain key: ${siteKey.slice(0, 16)}...\n`)

  const initial = await getSubscription(publisherId)
  console.log(`Initial state: ${initial.status} (period_end=${initial.current_period_end?.toISOString() ?? "none"})\n`)

  // ── Test 1: trialing in-period → should serve ─────────────────────────────
  let gc = await gateCheck(siteKey)
  console.log(`[1] trialing in-period   → token=${!!gc.token} ${gc.error ? "ERR=" + gc.error : ""}`)

  // ── Test 2: suspended → should NOT serve (no token even) ──────────────────
  await setSubscription(publisherId, { status: "suspended" })
  gc = await gateCheck(siteKey)
  console.log(`[2] suspended            → token=${!!gc.token} (expected false)`)

  // ── Test 3: cancelled w/ period in past → should NOT serve ────────────────
  const past = new Date(Date.now() - 1000)
  await setSubscription(publisherId, { status: "cancelled", current_period_end: past })
  gc = await gateCheck(siteKey)
  console.log(`[3] cancelled (expired)  → token=${!!gc.token} (expected false)`)

  // ── Test 4: cancelled w/ period in future → should serve ──────────────────
  const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
  await setSubscription(publisherId, { status: "cancelled", current_period_end: future })
  gc = await gateCheck(siteKey)
  console.log(`[4] cancelled (future)   → token=${!!gc.token} (expected true)`)

  // ── Test 5: trialing past period_end → should NOT serve ───────────────────
  await setSubscription(publisherId, { status: "trialing", current_period_end: past })
  gc = await gateCheck(siteKey)
  console.log(`[5] trialing expired     → token=${!!gc.token} (expected false)`)

  // ── Test 6: cron transitions trialing-expired → suspended ─────────────────
  const cronRes = await runCron()
  const after = await getSubscription(publisherId)
  console.log(`[6] cron run             → trialExpired=${cronRes.trialExpired} status=${after.status} (expected: 1, suspended)`)

  // ── Test 7: past_due > 7 days → cron suspends ─────────────────────────────
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
  await setSubscription(publisherId, { status: "past_due", dunning_started_at: eightDaysAgo, current_period_end: future })
  const cron2 = await runCron()
  const after2 = await getSubscription(publisherId)
  console.log(`[7] past_due 8d → cron   → dunningExpired=${cron2.dunningExpired} status=${after2.status} (expected: 1, suspended)`)

  // ── Cleanup: restore to a clean trialing state with 14 days remaining ──
  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  await setSubscription(publisherId, {
    status: "trialing",
    current_period_end: trialEnd,
    dunning_started_at: null,
    cancelled_at: null,
    cancel_at_cycle_end: false,
  })
  const final = await getSubscription(publisherId)
  console.log(`\nRestored: ${final.status}, period_end=${final.current_period_end.toISOString()}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => sql.end())
