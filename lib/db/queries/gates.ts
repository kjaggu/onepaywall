import { eq, and, isNull, asc } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { gates, gateSteps, gateRules, domains } from "@/lib/db/schema"

// ─── Ownership check helper ───────────────────────────────────────────────────

async function gateOwnedByPublisher(gateId: string, publisherId: string) {
  const [row] = await db
    .select({ id: gates.id })
    .from(gates)
    .innerJoin(domains, eq(gates.domainId, domains.id))
    .where(
      and(
        eq(gates.id, gateId),
        eq(domains.publisherId, publisherId),
        isNull(gates.deletedAt),
        isNull(domains.deletedAt),
      ),
    )
    .limit(1)
  return !!row
}

// ─── Gates ────────────────────────────────────────────────────────────────────

export async function listGatesForPublisher(publisherId: string) {
  return db
    .select({ gate: gates, domain: { id: domains.id, name: domains.name, domain: domains.domain } })
    .from(gates)
    .innerJoin(domains, eq(gates.domainId, domains.id))
    .where(and(eq(domains.publisherId, publisherId), isNull(gates.deletedAt), isNull(domains.deletedAt)))
    .orderBy(asc(domains.name), asc(gates.priority))
}

export async function listGatesForDomain(domainId: string, publisherId: string) {
  return db
    .select()
    .from(gates)
    .innerJoin(domains, eq(gates.domainId, domains.id))
    .where(
      and(
        eq(gates.domainId, domainId),
        eq(domains.publisherId, publisherId),
        isNull(gates.deletedAt),
        isNull(domains.deletedAt),
      ),
    )
    .orderBy(asc(gates.priority))
}

export async function getGate(id: string, publisherId: string) {
  const [row] = await db
    .select({ gate: gates, domain: { id: domains.id, name: domains.name, domain: domains.domain } })
    .from(gates)
    .innerJoin(domains, eq(gates.domainId, domains.id))
    .where(
      and(
        eq(gates.id, id),
        eq(domains.publisherId, publisherId),
        isNull(gates.deletedAt),
        isNull(domains.deletedAt),
      ),
    )
    .limit(1)
  return row ?? null
}

export async function createGate({
  domainId,
  publisherId,
  name,
  priority = 0,
}: {
  domainId: string
  publisherId: string
  name: string
  priority?: number
}) {
  // Verify domain belongs to publisher
  const [domain] = await db
    .select({ id: domains.id })
    .from(domains)
    .where(and(eq(domains.id, domainId), eq(domains.publisherId, publisherId), isNull(domains.deletedAt)))
    .limit(1)
  if (!domain) return null

  const [gate] = await db.insert(gates).values({ domainId, name, priority }).returning()
  return gate
}

export async function updateGate(
  id: string,
  publisherId: string,
  patch: Partial<{ name: string; priority: number; enabled: boolean; triggerConditions: object }>,
) {
  const owned = await gateOwnedByPublisher(id, publisherId)
  if (!owned) return null

  const [updated] = await db
    .update(gates)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(gates.id, id))
    .returning()
  return updated ?? null
}

export async function deleteGate(id: string, publisherId: string) {
  const owned = await gateOwnedByPublisher(id, publisherId)
  if (!owned) return false

  await db.update(gates).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(gates.id, id))
  return true
}

// ─── Gate steps ───────────────────────────────────────────────────────────────

export async function listSteps(gateId: string, publisherId: string) {
  const owned = await gateOwnedByPublisher(gateId, publisherId)
  if (!owned) return null
  return db.select().from(gateSteps).where(eq(gateSteps.gateId, gateId)).orderBy(asc(gateSteps.stepOrder))
}

export async function createStep({
  gateId,
  publisherId,
  stepType,
  config = {},
  onSkip = "proceed",
  onDecline = "proceed",
}: {
  gateId: string
  publisherId: string
  stepType: "ad" | "subscription_cta" | "one_time_unlock"
  config?: object
  onSkip?: "proceed" | "next_step"
  onDecline?: "proceed" | "next_step"
}) {
  const owned = await gateOwnedByPublisher(gateId, publisherId)
  if (!owned) return null

  // Next stepOrder = max + 1
  const existing = await db
    .select({ stepOrder: gateSteps.stepOrder })
    .from(gateSteps)
    .where(eq(gateSteps.gateId, gateId))
    .orderBy(asc(gateSteps.stepOrder))
  const nextOrder = existing.length ? existing[existing.length - 1].stepOrder + 1 : 1

  const [step] = await db
    .insert(gateSteps)
    .values({ gateId, stepType, stepOrder: nextOrder, config, onSkip, onDecline })
    .returning()
  return step
}

export async function updateStep(
  id: string,
  gateId: string,
  publisherId: string,
  patch: Partial<{ config: object; onSkip: "proceed" | "next_step"; onDecline: "proceed" | "next_step"; stepOrder: number }>,
) {
  const owned = await gateOwnedByPublisher(gateId, publisherId)
  if (!owned) return null

  const [updated] = await db
    .update(gateSteps)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(gateSteps.id, id), eq(gateSteps.gateId, gateId)))
    .returning()
  return updated ?? null
}

export async function deleteStep(id: string, gateId: string, publisherId: string) {
  const owned = await gateOwnedByPublisher(gateId, publisherId)
  if (!owned) return false

  const [deleted] = await db
    .delete(gateSteps)
    .where(and(eq(gateSteps.id, id), eq(gateSteps.gateId, gateId)))
    .returning()
  if (!deleted) return false

  // Re-number remaining steps
  const remaining = await db
    .select()
    .from(gateSteps)
    .where(eq(gateSteps.gateId, gateId))
    .orderBy(asc(gateSteps.stepOrder))
  await Promise.all(
    remaining.map((s, i) =>
      db.update(gateSteps).set({ stepOrder: i + 1, updatedAt: new Date() }).where(eq(gateSteps.id, s.id)),
    ),
  )
  return true
}

// ─── Gate rules ───────────────────────────────────────────────────────────────

export async function listRules(gateId: string, publisherId: string) {
  const owned = await gateOwnedByPublisher(gateId, publisherId)
  if (!owned) return null
  return db.select().from(gateRules).where(eq(gateRules.gateId, gateId)).orderBy(asc(gateRules.createdAt))
}

export async function createRule({
  gateId,
  publisherId,
  pattern,
  matchType = "path_glob",
}: {
  gateId: string
  publisherId: string
  pattern: string
  matchType?: "path_glob" | "content_type"
}) {
  const owned = await gateOwnedByPublisher(gateId, publisherId)
  if (!owned) return null

  const [rule] = await db.insert(gateRules).values({ gateId, pattern, matchType }).returning()
  return rule
}

export async function deleteRule(id: string, gateId: string, publisherId: string) {
  const owned = await gateOwnedByPublisher(gateId, publisherId)
  if (!owned) return false

  await db.delete(gateRules).where(and(eq(gateRules.id, id), eq(gateRules.gateId, gateId)))
  return true
}
