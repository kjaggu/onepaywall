import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import * as schema from "../lib/db/schema"

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function seed() {
  console.log("Seeding…")

  // ── Plans ──────────────────────────────────────────────────────────────────
  await db.insert(schema.plans).values([
    { slug: "trial",   name: "Trial",   priceMonthly: null,    maxDomains: 1,    maxMauPerDomain: 5000,    maxGates: 2,    trialDays: 30, active: true },
    { slug: "lite",    name: "Lite",    priceMonthly: 149900,  maxDomains: 1,    maxMauPerDomain: 5000,    maxGates: 2,    trialDays: 0,  active: true },
    { slug: "starter", name: "Starter", priceMonthly: 299900,  maxDomains: 3,    maxMauPerDomain: 25000,   maxGates: 10,   trialDays: 0,  active: true },
    { slug: "growth",  name: "Growth",  priceMonthly: 799900,  maxDomains: 10,   maxMauPerDomain: 100000,  maxGates: null, trialDays: 0,  active: true },
    { slug: "scale",   name: "Scale",   priceMonthly: 1999900, maxDomains: null, maxMauPerDomain: null,    maxGates: null, trialDays: 0,  active: true },
  ]).onConflictDoNothing()
  console.log("✓ Plans")

  // ── Superadmin user ────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Thakkol#1985", 10)
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, "jagadeeshk@outlook.com")).limit(1)

  if (!existing) {
    await db.insert(schema.users).values({
      email:        "jagadeeshk@outlook.com",
      passwordHash,
      name:         "Jagadeesh K",
      role:         "superadmin",
    })
    console.log("✓ Superadmin created")
  } else {
    console.log("✓ Superadmin already exists — skipped")
  }

  console.log("Done.")
}

seed().catch(e => { console.error(e); process.exit(1) })
