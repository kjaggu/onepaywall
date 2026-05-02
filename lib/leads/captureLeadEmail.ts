import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { gateUnlocks, readerSubscribers, readerSubscriptionLinks } from "@/lib/db/schema"
import { encrypt } from "@/lib/payments/encrypt"
import { normalizeSubscriberEmail, hashSubscriberEmail } from "@/lib/db/queries/reader-subscriptions"

type CaptureLeadInput = {
  publisherId: string
  brandId?: string | null
  readerId: string
  gateId: string
  email: string
  name?: string | null
  gdprConsent: boolean
}

export async function captureLeadEmail(input: CaptureLeadInput): Promise<{ subscriberId: string }> {
  const { publisherId, brandId, readerId, gateId, email, name } = input
  const normalized = normalizeSubscriberEmail(email)
  const emailHash = hashSubscriberEmail(normalized)

  // Upsert subscriber — if they already exist (e.g. from a prior subscription) keep
  // their record but don't downgrade source from 'subscription' to 'lead_capture'.
  let subscriberId: string
  if (brandId) {
    const [existing] = await db
      .select({ id: readerSubscribers.id })
      .from(readerSubscribers)
      .where(and(eq(readerSubscribers.brandId, brandId), eq(readerSubscribers.emailHash, emailHash)))
      .limit(1)

    if (existing) {
      subscriberId = existing.id
    } else {
      const [created] = await db
        .insert(readerSubscribers)
        .values({
          publisherId,
          brandId,
          emailHash,
          encryptedEmail: encrypt(normalized),
          source: "lead_capture",
          notes: name ?? null,
        })
        .returning({ id: readerSubscribers.id })
      subscriberId = created.id
    }

    // Link the anonymous reader to this subscriber so they are recognized on
    // future visits even without re-entering their email.
    await db
      .insert(readerSubscriptionLinks)
      .values({ publisherId, brandId, subscriberId, readerId })
      .onConflictDoNothing()
  } else {
    // No brand — publisher-level subscriber
    const [existing] = await db
      .select({ id: readerSubscribers.id })
      .from(readerSubscribers)
      .where(and(
        eq(readerSubscribers.publisherId, publisherId),
        eq(readerSubscribers.emailHash, emailHash),
      ))
      .limit(1)

    if (existing) {
      subscriberId = existing.id
    } else {
      const [created] = await db
        .insert(readerSubscribers)
        .values({
          publisherId,
          emailHash,
          encryptedEmail: encrypt(normalized),
          source: "lead_capture",
          notes: name ?? null,
        })
        .returning({ id: readerSubscribers.id })
      subscriberId = created.id
    }
  }

  // Write the gate unlock so the gate is not shown to this reader again.
  await db.insert(gateUnlocks).values({
    readerId,
    gateId,
    unlockType: "lead_capture",
  }).onConflictDoNothing()

  return { subscriberId }
}
