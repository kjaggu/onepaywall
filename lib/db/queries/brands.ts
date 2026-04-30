import { and, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { brands, domains, readerSubscriptions } from "@/lib/db/schema"

export async function listBrands(publisherId: string) {
  return db
    .select()
    .from(brands)
    .where(eq(brands.publisherId, publisherId))
    .orderBy(brands.createdAt)
}

export async function getBrand(brandId: string, publisherId: string) {
  const [row] = await db
    .select()
    .from(brands)
    .where(and(eq(brands.id, brandId), eq(brands.publisherId, publisherId)))
    .limit(1)
  return row ?? null
}

export async function getDefaultBrand(publisherId: string) {
  const [row] = await db
    .select()
    .from(brands)
    .where(eq(brands.publisherId, publisherId))
    .orderBy(brands.createdAt)
    .limit(1)
  return row ?? null
}

export async function getBrandBySlug(publisherId: string, slug: string) {
  const [row] = await db
    .select()
    .from(brands)
    .where(and(eq(brands.publisherId, publisherId), eq(brands.slug, slug)))
    .limit(1)
  return row ?? null
}

export async function createBrand(publisherId: string, data: { name: string; slug: string }) {
  const [row] = await db
    .insert(brands)
    .values({ publisherId, ...data })
    .returning()
  return row
}

export async function updateBrand(brandId: string, publisherId: string, patch: { name?: string }) {
  const [row] = await db
    .update(brands)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(brands.id, brandId), eq(brands.publisherId, publisherId)))
    .returning()
  return row ?? null
}

export async function countBrandsForPublisher(publisherId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(brands)
    .where(eq(brands.publisherId, publisherId))
  return row?.count ?? 0
}

export async function countDomainsForBrand(brandId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(domains)
    .where(and(eq(domains.brandId, brandId), sql`${domains.deletedAt} IS NULL`))
  return row?.count ?? 0
}

export async function countActiveSubscribersForBrand(brandId: string): Promise<number> {
  const now = new Date()
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(readerSubscriptions)
    .where(and(
      eq(readerSubscriptions.brandId, brandId),
      sql`${readerSubscriptions.status} IN ('active', 'authenticated')`,
      sql`(${readerSubscriptions.currentPeriodEnd} IS NULL OR ${readerSubscriptions.currentPeriodEnd} > ${now})`,
    ))
  return row?.count ?? 0
}

// Summary stats per brand for the brands list page
export async function getBrandsSummary(publisherId: string) {
  const allBrands = await listBrands(publisherId)
  if (allBrands.length === 0) return []

  const [domainCounts, subStats] = await Promise.all([
    db
      .select({ brandId: domains.brandId, count: sql<number>`count(*)::int` })
      .from(domains)
      .where(and(
        sql`${domains.brandId} = ANY(ARRAY[${sql.join(allBrands.map(b => sql`${b.id}`), sql`, `)}])`,
        sql`${domains.deletedAt} IS NULL`,
      ))
      .groupBy(domains.brandId),
    db
      .select({ brandId: readerSubscriptions.brandId, count: sql<number>`count(*)::int` })
      .from(readerSubscriptions)
      .where(and(
        sql`${readerSubscriptions.brandId} = ANY(ARRAY[${sql.join(allBrands.map(b => sql`${b.id}`), sql`, `)}])`,
        sql`${readerSubscriptions.status} IN ('active', 'authenticated')`,
      ))
      .groupBy(readerSubscriptions.brandId),
  ])

  const domainMap = new Map(domainCounts.map(r => [r.brandId, r.count]))
  const subMap = new Map(subStats.map(r => [r.brandId, r.count]))

  return allBrands.map(b => ({
    ...b,
    domainCount: domainMap.get(b.id) ?? 0,
    activeSubscriberCount: subMap.get(b.id) ?? 0,
  }))
}
