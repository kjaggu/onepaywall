#!/usr/bin/env node
/**
 * One-shot migration runner.
 *
 * - Applies every .sql file in db/migrations/ in lexical order.
 * - Tracks applied filenames in a `_migrations` table inside the DB itself.
 * - On first run against a pre-existing DB, seeds the tracking table from
 *   drizzle's legacy meta/_journal.json so already-applied migrations are
 *   not re-run.
 * - Idempotent: re-running is a no-op once the DB is up to date.
 *
 * Usage:
 *   npm run db:migrate         # apply pending migrations
 *   npm run db:migrate:status  # show pending/applied without writing
 */
import { readFileSync, readdirSync, existsSync } from "node:fs"
import path from "node:path"
import postgres from "postgres"

const MIGRATIONS_DIR = path.resolve(process.cwd(), "db/migrations")
const JOURNAL_PATH   = path.join(MIGRATIONS_DIR, "meta/_journal.json")
const STATUS_ONLY    = process.argv.includes("--status")

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL is not set. Did you forget --env-file=.env.local ?")
  process.exit(1)
}

const sql = postgres(url, {
  max: 1,
  idle_timeout: 5,
  prepare: false,
  onnotice: () => {}, // suppress NOTICE chatter from IF NOT EXISTS / DO $$ blocks
})

async function ensureTable() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename   text PRIMARY KEY,
      applied_at timestamp NOT NULL DEFAULT now()
    )
  `)
}

async function appliedFilenames() {
  const rows = await sql`SELECT filename FROM _migrations`
  return new Set(rows.map(r => r.filename))
}

// Seed legacy drizzle-tracked migrations as already-applied so the runner
// doesn't try to replay 0000/0001 against a DB that already has them.
async function seedFromDrizzleJournal() {
  const [{ count }] = await sql`SELECT count(*)::int AS count FROM _migrations`
  if (count > 0) return

  if (!existsSync(JOURNAL_PATH)) return

  const journal = JSON.parse(readFileSync(JOURNAL_PATH, "utf-8"))
  const tags = (journal.entries ?? []).map(e => `${e.tag}.sql`)

  for (const filename of tags) {
    if (existsSync(path.join(MIGRATIONS_DIR, filename))) {
      await sql`INSERT INTO _migrations (filename) VALUES (${filename}) ON CONFLICT DO NOTHING`
      console.log(`  seeded as already-applied: ${filename}`)
    }
  }
}

function listMigrationFiles() {
  return readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith(".sql"))
    .sort()
}

async function applyMigration(filename) {
  const fullPath = path.join(MIGRATIONS_DIR, filename)
  const stmt = readFileSync(fullPath, "utf-8")

  // Each migration runs in a transaction. Tracking insert is part of the same
  // tx so we never end up "applied in DB, untracked" or vice versa.
  await sql.begin(async tx => {
    await tx.unsafe(stmt)
    await tx`INSERT INTO _migrations (filename) VALUES (${filename})`
  })
}

async function main() {
  await ensureTable()
  await seedFromDrizzleJournal()

  const applied = await appliedFilenames()
  const all     = listMigrationFiles()
  const pending = all.filter(f => !applied.has(f))

  if (STATUS_ONLY) {
    console.log(`Applied (${all.length - pending.length}):`)
    for (const f of all) if (applied.has(f)) console.log(`  ✓ ${f}`)
    console.log(`\nPending (${pending.length}):`)
    for (const f of pending) console.log(`  · ${f}`)
    return
  }

  if (pending.length === 0) {
    console.log("DB is up to date.")
    return
  }

  console.log(`Applying ${pending.length} migration(s):`)
  for (const filename of pending) {
    process.stdout.write(`  → ${filename} ... `)
    try {
      await applyMigration(filename)
      console.log("ok")
    } catch (err) {
      console.log("FAILED")
      console.error(err)
      process.exit(1)
    }
  }
  console.log("\nDone.")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => sql.end())
