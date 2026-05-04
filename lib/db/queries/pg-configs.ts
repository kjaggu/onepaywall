import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { publisherPgConfigs } from "@/lib/db/schema"
import { encrypt, decrypt } from "@/lib/payments/encrypt"

export async function getOrCreatePgConfig(brandId: string, publisherId: string) {
  const [existing] = await db
    .select()
    .from(publisherPgConfigs)
    .where(eq(publisherPgConfigs.brandId, brandId))
    .limit(1)

  if (existing) return existing

  const [created] = await db
    .insert(publisherPgConfigs)
    .values({ publisherId, brandId })
    .returning()
  return created
}

export async function getPgConfig(brandId: string) {
  const [row] = await db
    .select()
    .from(publisherPgConfigs)
    .where(eq(publisherPgConfigs.brandId, brandId))
    .limit(1)
  return row ?? null
}

export async function updatePgConfig(
  brandId: string,
  patch: {
    mode?: "platform" | "own"
    keyId?: string
    keySecret?: string | null
    webhookSecret?: string | null
  },
) {
  const set: Record<string, unknown> = { updatedAt: new Date() }
  if (patch.mode !== undefined) set.mode = patch.mode
  if (patch.keyId !== undefined) set.keyId = patch.keyId || null
  if (patch.keySecret !== undefined) {
    set.keySecret = patch.keySecret ? encrypt(patch.keySecret) : null
  }
  if (patch.webhookSecret !== undefined) {
    set.webhookSecret = patch.webhookSecret ? encrypt(patch.webhookSecret) : null
  }

  const [row] = await db
    .update(publisherPgConfigs)
    .set(set)
    .where(eq(publisherPgConfigs.brandId, brandId))
    .returning()
  return row ?? null
}

function platformConfig() {
  return {
    mode: "platform" as const,
    provider: "razorpay" as const,
    keyId: process.env.RAZORPAY_KEY_ID ?? process.env.RAZORPAY_PLATFORM_KEY_ID ?? "",
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? process.env.RAZORPAY_PLATFORM_KEY_SECRET ?? "",
    webhookSecret: process.env.RAZORPAY_READER_WEBHOOK_SECRET ?? process.env.RAZORPAY_WEBHOOK_SECRET ?? process.env.RAZORPAY_PLATFORM_WEBHOOK_SECRET ?? "",
  }
}

function ownConfig(row: { keyId: string | null; keySecret: string | null; webhookSecret: string | null }) {
  return {
    mode: "own" as const,
    provider: "razorpay" as const,
    keyId: row.keyId ?? "",
    keySecret: row.keySecret ? decrypt(row.keySecret) : "",
    webhookSecret: row.webhookSecret ? decrypt(row.webhookSecret) : "",
  }
}

// Returns decrypted secrets — only for server-side payment processing
export async function resolveDecryptedConfig(brandId: string, publisherId: string) {
  const config = await getOrCreatePgConfig(brandId, publisherId)
  return config.mode === "platform" ? platformConfig() : ownConfig(config)
}

// Resolve config from a Razorpay subscription ID via our stored subscription record
// Used in webhook handlers where we only have the razorpay sub ID
export async function resolveDecryptedConfigByPublisher(publisherId: string) {
  const [existing] = await db
    .select()
    .from(publisherPgConfigs)
    .where(eq(publisherPgConfigs.publisherId, publisherId))
    .limit(1)

  if (!existing || existing.mode === "platform") return platformConfig()
  return ownConfig(existing)
}
