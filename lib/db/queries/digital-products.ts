import { and, eq, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { publisherDigitalProducts } from "@/lib/db/schema"

export type DigitalProduct = typeof publisherDigitalProducts.$inferSelect

export async function getDigitalProduct(productId: string): Promise<DigitalProduct | null> {
  const [row] = await db
    .select()
    .from(publisherDigitalProducts)
    .where(eq(publisherDigitalProducts.id, productId))
    .limit(1)
  return row ?? null
}

export async function listDigitalProducts(publisherId: string): Promise<DigitalProduct[]> {
  return db
    .select()
    .from(publisherDigitalProducts)
    .where(and(
      eq(publisherDigitalProducts.publisherId, publisherId),
      eq(publisherDigitalProducts.active, true),
    ))
    .orderBy(publisherDigitalProducts.createdAt)
}

export async function createDigitalProduct(input: {
  publisherId: string
  brandId?: string | null
  title: string
  description?: string | null
  r2Key: string
  fileName: string
  mimeType: string
  priceInPaise: number
}): Promise<DigitalProduct> {
  const [row] = await db
    .insert(publisherDigitalProducts)
    .values({
      publisherId: input.publisherId,
      brandId: input.brandId ?? null,
      title: input.title,
      description: input.description ?? null,
      r2Key: input.r2Key,
      fileName: input.fileName,
      mimeType: input.mimeType,
      priceInPaise: input.priceInPaise,
    })
    .returning()
  return row
}

export async function updateDigitalProduct(
  productId: string,
  publisherId: string,
  patch: Partial<{
    title: string
    description: string | null
    priceInPaise: number
    active: boolean
  }>,
): Promise<DigitalProduct | null> {
  const [row] = await db
    .update(publisherDigitalProducts)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(
      eq(publisherDigitalProducts.id, productId),
      eq(publisherDigitalProducts.publisherId, publisherId),
    ))
    .returning()
  return row ?? null
}

export async function incrementDownloadCount(productId: string): Promise<void> {
  await db
    .update(publisherDigitalProducts)
    .set({ downloadCount: sql`${publisherDigitalProducts.downloadCount} + 1` })
    .where(eq(publisherDigitalProducts.id, productId))
}
