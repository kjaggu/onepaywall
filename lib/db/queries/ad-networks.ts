import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { publisherAdNetworks } from "@/lib/db/schema"
import { encrypt, decrypt } from "@/lib/payments/encrypt"

export type AdProvider = "google_adsense" | "google_ad_manager"

export type AdNetworkRow = {
  id: string
  publisherId: string
  provider: AdProvider
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export type AdsenseCredentials = { adClientId: string }
export type GAMCredentials = { networkCode: string; adUnitRootPath: string }

export async function listAdNetworks(publisherId: string): Promise<AdNetworkRow[]> {
  const rows = await db
    .select({
      id:          publisherAdNetworks.id,
      publisherId: publisherAdNetworks.publisherId,
      provider:    publisherAdNetworks.provider,
      active:      publisherAdNetworks.active,
      createdAt:   publisherAdNetworks.createdAt,
      updatedAt:   publisherAdNetworks.updatedAt,
    })
    .from(publisherAdNetworks)
    .where(eq(publisherAdNetworks.publisherId, publisherId))
  return rows as AdNetworkRow[]
}

export async function getAdNetwork(id: string, publisherId: string): Promise<AdNetworkRow | null> {
  const [row] = await db
    .select({
      id:          publisherAdNetworks.id,
      publisherId: publisherAdNetworks.publisherId,
      provider:    publisherAdNetworks.provider,
      active:      publisherAdNetworks.active,
      createdAt:   publisherAdNetworks.createdAt,
      updatedAt:   publisherAdNetworks.updatedAt,
    })
    .from(publisherAdNetworks)
    .where(and(eq(publisherAdNetworks.id, id), eq(publisherAdNetworks.publisherId, publisherId)))
    .limit(1)
  return (row as AdNetworkRow) ?? null
}

export async function upsertAdNetwork(
  publisherId: string,
  provider: AdProvider,
  credentials: AdsenseCredentials | GAMCredentials,
  active: boolean = true,
): Promise<AdNetworkRow> {
  const encryptedCredentials = encrypt(JSON.stringify(credentials))

  const [row] = await db
    .insert(publisherAdNetworks)
    .values({ publisherId, provider, credentials: encryptedCredentials, active })
    .onConflictDoUpdate({
      target: [publisherAdNetworks.publisherId, publisherAdNetworks.provider],
      set: { credentials: encryptedCredentials, active, updatedAt: new Date() },
    })
    .returning({
      id:          publisherAdNetworks.id,
      publisherId: publisherAdNetworks.publisherId,
      provider:    publisherAdNetworks.provider,
      active:      publisherAdNetworks.active,
      createdAt:   publisherAdNetworks.createdAt,
      updatedAt:   publisherAdNetworks.updatedAt,
    })
  return row as AdNetworkRow
}

export async function updateAdNetworkActive(id: string, publisherId: string, active: boolean): Promise<void> {
  await db
    .update(publisherAdNetworks)
    .set({ active, updatedAt: new Date() })
    .where(and(eq(publisherAdNetworks.id, id), eq(publisherAdNetworks.publisherId, publisherId)))
}

export async function deleteAdNetwork(id: string, publisherId: string): Promise<void> {
  await db
    .delete(publisherAdNetworks)
    .where(and(eq(publisherAdNetworks.id, id), eq(publisherAdNetworks.publisherId, publisherId)))
}

export async function getDecryptedCredentials(
  id: string,
  publisherId: string,
): Promise<AdsenseCredentials | GAMCredentials | null> {
  const [row] = await db
    .select({ credentials: publisherAdNetworks.credentials })
    .from(publisherAdNetworks)
    .where(and(eq(publisherAdNetworks.id, id), eq(publisherAdNetworks.publisherId, publisherId)))
    .limit(1)

  if (!row) return null
  try {
    return JSON.parse(decrypt(row.credentials as string)) as AdsenseCredentials | GAMCredentials
  } catch {
    return null
  }
}

export async function getDecryptedCredentialsById(id: string): Promise<{
  provider: AdProvider
  credentials: AdsenseCredentials | GAMCredentials
} | null> {
  const [row] = await db
    .select({
      provider:    publisherAdNetworks.provider,
      credentials: publisherAdNetworks.credentials,
    })
    .from(publisherAdNetworks)
    .where(eq(publisherAdNetworks.id, id))
    .limit(1)

  if (!row) return null
  try {
    return {
      provider: row.provider as AdProvider,
      credentials: JSON.parse(decrypt(row.credentials as string)) as AdsenseCredentials | GAMCredentials,
    }
  } catch {
    return null
  }
}
