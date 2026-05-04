import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import * as schema from "../lib/db/schema"

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })

async function seed() {
  console.log("Seeding…")

  // ── Plans (v2 pricing) ─────────────────────────────────────────────────────
  await db.insert(schema.plans).values([
    {
      slug: "trial", name: "Trial",
      priceMonthly: null, priceMonthlyUsd: null,
      commissionBps: 0,
      byokAddonPriceInr: null, byokAddonPriceUsd: null,
      maxMonthlyGateTriggers: 1_000,
      maxDomains: null, maxGates: 2, trialDays: 14, active: true,
      maxPayingSubscribers: 50,
      subscriberOveragePriceInr: null, subscriberOveragePriceUsd: null,
      maxFreeAdImpressions: 10_000,
      adOveragePricePerMilleInr: 1500, adOveragePricePerMilleUsd: 20,
    },
    {
      slug: "lite", name: "Lite",
      priceMonthly: 299900, priceMonthlyUsd: 2900,
      commissionBps: 400,
      byokAddonPriceInr: 149900, byokAddonPriceUsd: 1500,
      maxMonthlyGateTriggers: 10_000,
      maxDomains: null, maxGates: 5, trialDays: 14, active: true,
      maxPayingSubscribers: 250,
      subscriberOveragePriceInr: 800, subscriberOveragePriceUsd: 10,
      maxFreeAdImpressions: 10_000,
      adOveragePricePerMilleInr: 1500, adOveragePricePerMilleUsd: 20,
    },
    {
      slug: "starter", name: "Starter",
      priceMonthly: 749900, priceMonthlyUsd: 7900,
      commissionBps: 300,
      byokAddonPriceInr: 399900, byokAddonPriceUsd: 3900,
      maxMonthlyGateTriggers: 50_000,
      maxDomains: null, maxGates: 20, trialDays: 14, active: true,
      maxPayingSubscribers: 1500,
      subscriberOveragePriceInr: 500, subscriberOveragePriceUsd: 6,
      maxFreeAdImpressions: 50_000,
      adOveragePricePerMilleInr: 1200, adOveragePricePerMilleUsd: 15,
    },
    {
      slug: "growth", name: "Growth",
      priceMonthly: 1899900, priceMonthlyUsd: 19900,
      commissionBps: 200,
      byokAddonPriceInr: 999900, byokAddonPriceUsd: 9900,
      maxMonthlyGateTriggers: 250_000,
      maxDomains: null, maxGates: null, trialDays: 0, active: true,
      maxPayingSubscribers: 10_000,
      subscriberOveragePriceInr: 300, subscriberOveragePriceUsd: 4,
      maxFreeAdImpressions: 200_000,
      adOveragePricePerMilleInr: 900, adOveragePricePerMilleUsd: 10,
    },
    {
      slug: "scale", name: "Scale",
      priceMonthly: 4999900, priceMonthlyUsd: 49900,
      commissionBps: 150,
      byokAddonPriceInr: 2499900, byokAddonPriceUsd: 24900,
      maxMonthlyGateTriggers: 1_000_000,
      maxDomains: null, maxGates: null, trialDays: 0, active: true,
      maxPayingSubscribers: null,
      subscriberOveragePriceInr: null, subscriberOveragePriceUsd: null,
      maxFreeAdImpressions: null,
      adOveragePricePerMilleInr: 0, adOveragePricePerMilleUsd: 0,
    },
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

  // ── Publisher test user ────────────────────────────────────────────────────
  const pubEmail = "publisher@test.com"
  const [existingPub] = await db.select().from(schema.users).where(eq(schema.users.email, pubEmail)).limit(1)

  if (!existingPub) {
    const pubHash = await bcrypt.hash("Test1234!", 10)
    const [pubUser] = await db.insert(schema.users).values({
      email:        pubEmail,
      passwordHash: pubHash,
      name:         "Test Publisher",
      role:         "publisher",
    }).returning()

    const [publisher] = await db.insert(schema.publishers).values({
      name: "Test Publication",
      slug: "test-publication",
    }).returning()

    await db.insert(schema.publisherMembers).values({
      publisherId: publisher.id,
      userId:      pubUser.id,
      role:        "owner",
    })

    console.log("✓ Publisher test user created (publisher@test.com / Test1234!)")
  } else {
    console.log("✓ Publisher test user already exists — skipped")
  }

  console.log("Done.")
}

seed().catch(e => { console.error(e); process.exit(1) })
