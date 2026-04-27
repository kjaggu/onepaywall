import { eq, and, isNull } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { domains } from "@/lib/db/schema"
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
