import { db } from "@/lib/db/client"
import { adUnits } from "@/lib/db/schema"
import { eq, isNull, and } from "drizzle-orm"
import type { AdUnitCandidate } from "@/lib/ads/rotate"

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
  adNetworkId?: string
  networkConfig?: Record<string, unknown>
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

export async function listActiveDirectAdUnits(publisherId: string): Promise<AdUnitCandidate[]> {
  const rows = await db
    .select({
      id:                 adUnits.id,
      relevantCategories: adUnits.relevantCategories,
      weight:             adUnits.weight,
      mediaType:          adUnits.mediaType,
      cdnUrl:             adUnits.cdnUrl,
      ctaLabel:           adUnits.ctaLabel,
      ctaUrl:             adUnits.ctaUrl,
      skipAfterSeconds:   adUnits.skipAfterSeconds,
      sourceType:         adUnits.sourceType,
      adNetworkId:        adUnits.adNetworkId,
      networkConfig:      adUnits.networkConfig,
    })
    .from(adUnits)
    .where(
      and(
        eq(adUnits.publisherId, publisherId),
        eq(adUnits.sourceType, "direct"),
        eq(adUnits.active, true),
        isNull(adUnits.deletedAt),
      )
    )
  return rows as AdUnitCandidate[]
}

// All active ad units (direct + network) — used by the rotation engine
export async function listActiveAdUnits(publisherId: string): Promise<AdUnitCandidate[]> {
  const rows = await db
    .select({
      id:                 adUnits.id,
      relevantCategories: adUnits.relevantCategories,
      weight:             adUnits.weight,
      mediaType:          adUnits.mediaType,
      cdnUrl:             adUnits.cdnUrl,
      ctaLabel:           adUnits.ctaLabel,
      ctaUrl:             adUnits.ctaUrl,
      skipAfterSeconds:   adUnits.skipAfterSeconds,
      sourceType:         adUnits.sourceType,
      adNetworkId:        adUnits.adNetworkId,
      networkConfig:      adUnits.networkConfig,
    })
    .from(adUnits)
    .where(
      and(
        eq(adUnits.publisherId, publisherId),
        eq(adUnits.active, true),
        isNull(adUnits.deletedAt),
      )
    )
  return rows as AdUnitCandidate[]
}
