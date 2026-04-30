import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { publisherPgConfigs } from "@/lib/db/schema"
import { encrypt, decrypt } from "@/lib/payments/encrypt"

export async function getOrCreatePgConfig(publisherId: string) {
  const [existing] = await db
    .select()
    .from(publisherPgConfigs)
    .where(eq(publisherPgConfigs.publisherId, publisherId))
    .limit(1)

  if (existing) return existing

  const [created] = await db
    .insert(publisherPgConfigs)
    .values({ publisherId })
    .returning()
  return created
}

export async function updatePgConfig(
  publisherId: string,
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
    .where(eq(publisherPgConfigs.publisherId, publisherId))
    .returning()
  return row ?? null
}

// Returns decrypted secrets — only for server-side payment processing
export async function resolveDecryptedConfig(publisherId: string) {
  const config = await getOrCreatePgConfig(publisherId)
  if (config.mode === "platform") {
    return {
      mode: "platform" as const,
      provider: "razorpay" as const,
      keyId: process.env.RAZORPAY_KEY_ID ?? process.env.RAZORPAY_PLATFORM_KEY_ID ?? "",
      keySecret: process.env.RAZORPAY_KEY_SECRET ?? process.env.RAZORPAY_PLATFORM_KEY_SECRET ?? "",
      webhookSecret: process.env.RAZORPAY_READER_WEBHOOK_SECRET ?? process.env.RAZORPAY_WEBHOOK_SECRET ?? process.env.RAZORPAY_PLATFORM_WEBHOOK_SECRET ?? "",
    }
  }
  return {
    mode: "own" as const,
    provider: "razorpay" as const,
    keyId: config.keyId ?? "",
    keySecret: config.keySecret ? decrypt(config.keySecret) : "",
    webhookSecret: config.webhookSecret ? decrypt(config.webhookSecret) : "",
  }
}
