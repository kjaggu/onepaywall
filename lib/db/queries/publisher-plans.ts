import { db } from "@/lib/db/client"
import { publisherReaderPlans, publisherContentPrices } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

export async function getPublisherReaderPlan(publisherId: string) {
  const [row] = await db
    .select()
    .from(publisherReaderPlans)
    .where(eq(publisherReaderPlans.publisherId, publisherId))
  return row ?? null
}

export async function upsertPublisherReaderPlan(publisherId: string, data: {
  currency?: string
  monthlyPrice?: number | null
  quarterlyPrice?: number | null
  annualPrice?: number | null
  subsEnabled?: boolean
  defaultUnlockPrice?: number | null
  unlockEnabled?: boolean
}) {
  const existing = await getPublisherReaderPlan(publisherId)
  if (existing) {
    const [row] = await db
      .update(publisherReaderPlans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(publisherReaderPlans.publisherId, publisherId))
      .returning()
    return row
  } else {
    const [row] = await db
      .insert(publisherReaderPlans)
      .values({ publisherId, ...data })
      .returning()
    return row
  }
}

export async function listContentPrices(publisherId: string) {
  return db
    .select()
    .from(publisherContentPrices)
    .where(eq(publisherContentPrices.publisherId, publisherId))
    .orderBy(publisherContentPrices.createdAt)
}

export async function addContentPrice(publisherId: string, data: {
  urlPattern: string
  price: number
  label?: string
}) {
  const [row] = await db
    .insert(publisherContentPrices)
    .values({ publisherId, ...data })
    .returning()
  return row
}

export async function deleteContentPrice(id: string, publisherId: string) {
  await db
    .delete(publisherContentPrices)
    .where(and(
      eq(publisherContentPrices.id, id),
      eq(publisherContentPrices.publisherId, publisherId),
    ))
}
