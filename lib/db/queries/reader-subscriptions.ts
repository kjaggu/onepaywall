import { createHash, randomBytes } from "crypto"
import { and, desc, eq, gt, inArray, isNull, or } from "drizzle-orm"
import { db } from "@/lib/db/client"
import {
  readerSubscribers,
  readerSubscriptions,
  readerSubscriptionLinks,
  readerSubscriptionMagicLinks,
  publishers,
} from "@/lib/db/schema"
import { encrypt, decrypt } from "@/lib/payments/encrypt"
import { markReaderTransactionCompleted } from "@/lib/db/queries/transactions"

export type ReaderBillingInterval = "monthly" | "quarterly" | "annual"

const ACTIVE_STATUSES = ["active", "authenticated"] as const

export function normalizeSubscriberEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function hashSubscriberEmail(email: string): string {
  return createHash("sha256").update(normalizeSubscriberEmail(email)).digest("hex")
}

export async function getOrCreateSubscriber(publisherId: string, email: string) {
  const normalized = normalizeSubscriberEmail(email)
  const emailHash = hashSubscriberEmail(normalized)

  const [existing] = await db
    .select()
    .from(readerSubscribers)
    .where(and(eq(readerSubscribers.publisherId, publisherId), eq(readerSubscribers.emailHash, emailHash)))
    .limit(1)

  if (existing) return existing

  const [created] = await db
    .insert(readerSubscribers)
    .values({
      publisherId,
      emailHash,
      encryptedEmail: encrypt(normalized),
    })
    .returning()
  return created
}

export async function getSubscriberByEmail(publisherId: string, email: string) {
  const emailHash = hashSubscriberEmail(email)
  const [row] = await db
    .select()
    .from(readerSubscribers)
    .where(and(eq(readerSubscribers.publisherId, publisherId), eq(readerSubscribers.emailHash, emailHash)))
    .limit(1)
  return row ?? null
}

export function getSubscriberEmail(row: typeof readerSubscribers.$inferSelect): string {
  return decrypt(row.encryptedEmail)
}

export async function getSubscriberById(subscriberId: string) {
  const [row] = await db
    .select()
    .from(readerSubscribers)
    .where(eq(readerSubscribers.id, subscriberId))
    .limit(1)
  return row ?? null
}

export async function setSubscriberCustomerId(subscriberId: string, customerId: string) {
  const [row] = await db
    .update(readerSubscribers)
    .set({ razorpayCustomerId: customerId, updatedAt: new Date() })
    .where(eq(readerSubscribers.id, subscriberId))
    .returning()
  return row
}

export async function upsertReaderSubscription(input: {
  publisherId: string
  subscriberId: string
  interval: ReaderBillingInterval
  pgMode: "platform" | "own"
  razorpaySubscriptionId: string
  razorpayPlanId: string
  status: string
  currentPeriodStart?: Date | null
  currentPeriodEnd?: Date | null
  cancelledAt?: Date | null
  cancelAtCycleEnd?: boolean
  dunningStartedAt?: Date | null
}) {
  const existing = await getReaderSubscriptionByRazorpayId(input.razorpaySubscriptionId)
  const values = {
    publisherId: input.publisherId,
    subscriberId: input.subscriberId,
    interval: input.interval,
    pgMode: input.pgMode,
    razorpaySubscriptionId: input.razorpaySubscriptionId,
    razorpayPlanId: input.razorpayPlanId,
    status: input.status,
    currentPeriodStart: input.currentPeriodStart ?? null,
    currentPeriodEnd: input.currentPeriodEnd ?? null,
    cancelledAt: input.cancelledAt ?? null,
    cancelAtCycleEnd: input.cancelAtCycleEnd ?? false,
    dunningStartedAt: input.dunningStartedAt ?? null,
  }

  if (existing) {
    const [row] = await db
      .update(readerSubscriptions)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(readerSubscriptions.id, existing.id))
      .returning()
    return row
  }

  const [row] = await db.insert(readerSubscriptions).values(values).returning()
  return row
}

export async function getReaderSubscriptionByRazorpayId(razorpaySubscriptionId: string) {
  const [row] = await db
    .select()
    .from(readerSubscriptions)
    .where(eq(readerSubscriptions.razorpaySubscriptionId, razorpaySubscriptionId))
    .limit(1)
  return row ?? null
}

export async function updateReaderSubscriptionStatus(
  razorpaySubscriptionId: string,
  patch: Partial<{
    status: string
    currentPeriodStart: Date | null
    currentPeriodEnd: Date | null
    cancelledAt: Date | null
    cancelAtCycleEnd: boolean
    dunningStartedAt: Date | null
  }>,
) {
  const [row] = await db
    .update(readerSubscriptions)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(readerSubscriptions.razorpaySubscriptionId, razorpaySubscriptionId))
    .returning()
  return row ?? null
}

export async function linkReaderToSubscriber(input: {
  publisherId: string
  subscriberId: string
  readerId: string
}) {
  await db
    .insert(readerSubscriptionLinks)
    .values(input)
    .onConflictDoUpdate({
      target: [readerSubscriptionLinks.readerId, readerSubscriptionLinks.publisherId],
      set: { subscriberId: input.subscriberId },
    })
}

export async function readerHasActivePublisherSubscription(publisherId: string, readerId: string) {
  const now = new Date()
  const rows = await db
    .select({ id: readerSubscriptions.id })
    .from(readerSubscriptionLinks)
    .innerJoin(readerSubscriptions, eq(readerSubscriptionLinks.subscriberId, readerSubscriptions.subscriberId))
    .where(and(
      eq(readerSubscriptionLinks.publisherId, publisherId),
      eq(readerSubscriptionLinks.readerId, readerId),
      eq(readerSubscriptions.publisherId, publisherId),
      inArray(readerSubscriptions.status, [...ACTIVE_STATUSES]),
      or(isNull(readerSubscriptions.currentPeriodEnd), gt(readerSubscriptions.currentPeriodEnd, now)),
    ))
    .limit(1)
  return rows.length > 0
}

export async function subscriberHasActiveSubscription(publisherId: string, subscriberId: string) {
  const now = new Date()
  const rows = await db
    .select({ id: readerSubscriptions.id })
    .from(readerSubscriptions)
    .where(and(
      eq(readerSubscriptions.publisherId, publisherId),
      eq(readerSubscriptions.subscriberId, subscriberId),
      inArray(readerSubscriptions.status, [...ACTIVE_STATUSES]),
      or(isNull(readerSubscriptions.currentPeriodEnd), gt(readerSubscriptions.currentPeriodEnd, now)),
    ))
    .limit(1)
  return rows.length > 0
}

export async function createSubscriptionMagicLink(input: {
  publisherId: string
  subscriberId: string
  returnUrl?: string | null
  ttlMinutes?: number
}) {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + (input.ttlMinutes ?? 30) * 60 * 1000)
  await db.insert(readerSubscriptionMagicLinks).values({
    token,
    publisherId: input.publisherId,
    subscriberId: input.subscriberId,
    returnUrl: input.returnUrl ?? null,
    expiresAt,
  })
  return { token, expiresAt }
}

export async function consumeSubscriptionMagicLink(token: string) {
  const [row] = await db
    .select()
    .from(readerSubscriptionMagicLinks)
    .where(and(
      eq(readerSubscriptionMagicLinks.token, token),
      isNull(readerSubscriptionMagicLinks.usedAt),
      gt(readerSubscriptionMagicLinks.expiresAt, new Date()),
    ))
    .limit(1)

  if (!row) return null

  await db
    .update(readerSubscriptionMagicLinks)
    .set({ usedAt: new Date() })
    .where(eq(readerSubscriptionMagicLinks.token, token))

  return row
}

export async function listSubscribers(publisherId: string, options?: { status?: string }) {
  const conditions = [eq(readerSubscriptions.publisherId, publisherId)]
  if (options?.status) conditions.push(eq(readerSubscriptions.status, options.status))

  const rows = await db
    .select({
      subscriberId: readerSubscribers.id,
      encryptedEmail: readerSubscribers.encryptedEmail,
      interval: readerSubscriptions.interval,
      status: readerSubscriptions.status,
      since: readerSubscribers.createdAt,
      currentPeriodEnd: readerSubscriptions.currentPeriodEnd,
      cancelledAt: readerSubscriptions.cancelledAt,
      dunningStartedAt: readerSubscriptions.dunningStartedAt,
      razorpaySubscriptionId: readerSubscriptions.razorpaySubscriptionId,
    })
    .from(readerSubscriptions)
    .innerJoin(readerSubscribers, eq(readerSubscriptions.subscriberId, readerSubscribers.id))
    .where(and(...conditions))
    .orderBy(desc(readerSubscriptions.createdAt))
    .limit(500)

  return rows.map(({ encryptedEmail, ...row }) => ({
    ...row,
    email: decrypt(encryptedEmail),
  }))
}

export async function getSubscriberStats(publisherId: string) {
  const rows = await db
    .select({ status: readerSubscriptions.status })
    .from(readerSubscriptions)
    .where(eq(readerSubscriptions.publisherId, publisherId))

  const stats = { total: 0, active: 0, past_due: 0, paused: 0, cancelled: 0 }
  for (const r of rows) {
    stats.total++
    if (r.status === "active" || r.status === "authenticated") stats.active++
    else if (r.status === "past_due") stats.past_due++
    else if (r.status === "paused") stats.paused++
    else if (r.status === "cancelled") stats.cancelled++
  }
  return stats
}

export async function recordReaderSubscriptionPayment(input: {
  publisherId: string
  readerId?: string | null
  razorpayPaymentId: string
  razorpaySubscriptionId: string
  amount: number
  currency: string
  interval: string
  readerEmail?: string | null
}) {
  const [pub] = await db
    .select({ currency: publishers.currency })
    .from(publishers)
    .where(eq(publishers.id, input.publisherId))
    .limit(1)

  const result = await markReaderTransactionCompleted({
    publisherId: input.publisherId,
    readerId: input.readerId ?? undefined,
    amount: input.amount,
    currency: input.currency || pub?.currency || "INR",
    razorpayPaymentId: input.razorpayPaymentId,
    razorpaySubscriptionId: input.razorpaySubscriptionId,
    readerEmail: input.readerEmail ?? null,
    metadata: {
      razorpaySubscriptionId: input.razorpaySubscriptionId,
      interval: input.interval,
    },
  })

  return { alreadyRecorded: result.alreadyRecorded }
}
