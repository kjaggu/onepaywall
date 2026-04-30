import { eq, and, isNull, isNotNull, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { domains, publishers } from "@/lib/db/schema"
import { generateSiteKey } from "@/lib/embed/siteKey"

export async function listDomains(publisherId: string) {
  return db
    .select()
    .from(domains)
    .where(and(eq(domains.publisherId, publisherId), isNull(domains.deletedAt)))
    .orderBy(domains.createdAt)
}

export async function getDomain(id: string, publisherId: string) {
  const [row] = await db
    .select()
    .from(domains)
    .where(and(eq(domains.id, id), eq(domains.publisherId, publisherId), isNull(domains.deletedAt)))
    .limit(1)
  return row ?? null
}

export async function getDomainOwnerByHost(domain: string) {
  const normalised = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "")
  const [row] = await db
    .select({
      id: domains.id,
      domain: domains.domain,
      publisherId: domains.publisherId,
      publisherName: publishers.name,
      deletedAt: domains.deletedAt,
    })
    .from(domains)
    .innerJoin(publishers, eq(domains.publisherId, publishers.id))
    .where(eq(domains.domain, normalised))
    .limit(1)
  return row ?? null
}

export async function createDomain({
  publisherId,
  name,
  domain,
}: {
  publisherId: string
  name: string
  domain: string
}) {
  const normalised = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "")
  const siteKey = generateSiteKey()

  // If this publisher previously deleted this domain, restore it with a fresh siteKey
  const [deleted] = await db
    .select({ id: domains.id })
    .from(domains)
    .where(and(eq(domains.domain, normalised), eq(domains.publisherId, publisherId), isNotNull(domains.deletedAt)))
    .limit(1)

  if (deleted) {
    const [restored] = await db
      .update(domains)
      .set({ name, siteKey, embedEnabled: false, status: "active", deletedAt: null, updatedAt: new Date() })
      .where(eq(domains.id, deleted.id))
      .returning()
    return restored
  }

  const [row] = await db
    .insert(domains)
    .values({ publisherId, name, domain: normalised, siteKey })
    .returning()
  return row
}

export async function updateDomain(
  id: string,
  publisherId: string,
  patch: Partial<{ name: string; status: "active" | "paused" | "removed"; embedEnabled: boolean; whitelistedPaths: string[] }>,
) {
  const [row] = await db
    .update(domains)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(domains.id, id), eq(domains.publisherId, publisherId), isNull(domains.deletedAt)))
    .returning()
  return row ?? null
}

export async function deleteDomain(id: string, publisherId: string) {
  await db
    .update(domains)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(domains.id, id), eq(domains.publisherId, publisherId), isNull(domains.deletedAt)))
}

// Mark a domain's embed as verified (called automatically on first gate-check hit).
export async function markEmbedVerified(siteKey: string) {
  await db
    .update(domains)
    .set({ embedEnabled: true, updatedAt: new Date() })
    .where(and(eq(domains.siteKey, siteKey), isNull(domains.deletedAt)))
}

// Count of non-deleted domains for plan-limit enforcement.
export async function countActiveDomains(publisherId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(domains)
    .where(and(eq(domains.publisherId, publisherId), isNull(domains.deletedAt)))
  return row?.count ?? 0
}
