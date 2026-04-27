import { db } from "@/lib/db/client"
import { adUnits } from "@/lib/db/schema"
import { eq, isNull, and } from "drizzle-orm"

export async function listAdUnits(publisherId: string) {
  return db
    .select()
    .from(adUnits)
    .where(and(eq(adUnits.publisherId, publisherId), isNull(adUnits.deletedAt)))
    .orderBy(adUnits.createdAt)
}

export async function getAdUnit(id: string, publisherId: string) {
  const [row] = await db
    .select()
    .from(adUnits)
    .where(and(eq(adUnits.id, id), eq(adUnits.publisherId, publisherId), isNull(adUnits.deletedAt)))
  return row ?? null
}

export async function createAdUnit(publisherId: string, data: {
  name: string
  sourceType: "direct" | "network"
  mediaType?: "image" | "video"
  storageKey?: string
  cdnUrl?: string
  ctaLabel?: string
  ctaUrl?: string
  skipAfterSeconds?: number | null
  weight?: number
}) {
  const [row] = await db
    .insert(adUnits)
    .values({ publisherId, ...data })
    .returning()
  return row
}

export async function updateAdUnit(id: string, publisherId: string, data: Partial<{
  name: string
  ctaLabel: string
  ctaUrl: string
  skipAfterSeconds: number | null
  weight: number
  active: boolean
  storageKey: string
  cdnUrl: string
}>) {
  const [row] = await db
    .update(adUnits)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(adUnits.id, id), eq(adUnits.publisherId, publisherId)))
    .returning()
  return row
}

export async function deleteAdUnit(id: string, publisherId: string) {
  await db
    .update(adUnits)
    .set({ deletedAt: new Date() })
    .where(and(eq(adUnits.id, id), eq(adUnits.publisherId, publisherId)))
}
