#!/usr/bin/env node
/**
 * One-shot: ensure every existing publisher has a current subscription row.
 *
 * Today's register.ts creates a trialing Starter row at signup. Publishers
 * who signed up before that change can have no row, or a row whose planSlug
 * is the deprecated 'trial' tier. This script:
 *   - deactivates the stale 'trial' plan row left over from migration 0001
 *   - inserts a fresh trialing Starter (14d) row for any publisher missing
 *     a subscription
 *
 * Idempotent — re-running adds nothing once everyone has a row.
 */
import postgres from "postgres"

const url = process.env.DATABASE_URL
if (!url) { console.error("DATABASE_URL not set"); process.exit(1) }

const sql = postgres(url, { max: 1, idle_timeout: 5, prepare: false, onnotice: () => {} })

async function main() {
  // 1. Deactivate the legacy 'trial' plan tier — it pollutes /api/billing's
  //    plan catalog. Leaving the row in place (FK-safe) but hidden.
  const deactivated = await sql`
    UPDATE plans SET active = false WHERE slug = 'trial' AND active = true RETURNING slug
  `
  if (deactivated.length > 0) console.log(`✓ deactivated stale 'trial' plan row`)

  // 2. Find publishers with no subscription, give them a 14-day Starter trial.
  const orphans = await sql`
    SELECT p.id FROM publishers p
    LEFT JOIN subscriptions s ON s.publisher_id = p.id
    WHERE s.id IS NULL AND p.deleted_at IS NULL
  `

  if (orphans.length === 0) {
    console.log("✓ every publisher already has a subscription row")
  } else {
    console.log(`Backfilling ${orphans.length} publisher(s):`)
    const now = new Date()
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    for (const { id } of orphans) {
      await sql`
        INSERT INTO subscriptions (publisher_id, plan_slug, status, current_period_start, current_period_end)
        VALUES (${id}, 'starter', 'trialing', ${now}, ${trialEnd})
      `
      console.log(`  ✓ ${id} → trialing Starter, 14d`)
    }
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => sql.end())
