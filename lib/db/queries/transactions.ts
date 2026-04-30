import { db } from "@/lib/db/client"
import { readerTransactions, domains } from "@/lib/db/schema"
import { eq, and, gte, lte, desc, or, inArray } from "drizzle-orm"
import { encrypt, decrypt } from "@/lib/payments/encrypt"
import { createHash } from "crypto"
import type { SQL } from "drizzle-orm"

export type TransactionFilter = {
  type?: "subscription" | "one_time_unlock"
  status?: "pending" | "completed" | "refunded" | "failed"
  domainId?: string
  from?: Date
  to?: Date
}

function normalizeReaderEmail(email: string): string {
  return email.trim().toLowerCase()
}

function hashReaderEmail(email: string): string {
  return createHash("sha256").update(normalizeReaderEmail(email)).digest("hex")
}

export async function listTransactions(publisherId: string, filter: TransactionFilter = {}) {
  const conditions = [eq(readerTransactions.publisherId, publisherId)]

  if (filter.type)     conditions.push(eq(readerTransactions.type, filter.type))
  if (filter.status)   conditions.push(eq(readerTransactions.status, filter.status))
  if (filter.domainId) conditions.push(eq(readerTransactions.domainId, filter.domainId))
  if (filter.from)     conditions.push(gte(readerTransactions.createdAt, filter.from))
  if (filter.to)       conditions.push(lte(readerTransactions.createdAt, filter.to))

  return db
    .select({
      id:                readerTransactions.id,
      type:              readerTransactions.type,
      status:            readerTransactions.status,
      amount:            readerTransactions.amount,
      currency:          readerTransactions.currency,
      razorpayPaymentId: readerTransactions.razorpayPaymentId,
      razorpayOrderId:   readerTransactions.razorpayOrderId,
      razorpaySubscriptionId: readerTransactions.razorpaySubscriptionId,
      readerEmailHash:   readerTransactions.readerEmailHash,
      encryptedReaderEmail: readerTransactions.encryptedReaderEmail,
      contentUrl:        readerTransactions.contentUrl,
      failureReason:     readerTransactions.failureReason,
      metadata:          readerTransactions.metadata,
      readerId:          readerTransactions.readerId,
      domainId:          readerTransactions.domainId,
      createdAt:         readerTransactions.createdAt,
      updatedAt:         readerTransactions.updatedAt,
      completedAt:       readerTransactions.completedAt,
      domainName:        domains.name,
      domainHost:        domains.domain,
    })
    .from(readerTransactions)
    .leftJoin(domains, eq(readerTransactions.domainId, domains.id))
    .where(and(...conditions))
    .orderBy(desc(readerTransactions.createdAt))
    .limit(500)
    .then(rows => rows.map(row => ({
      ...row,
      readerEmail: row.encryptedReaderEmail ? decrypt(row.encryptedReaderEmail) : null,
      encryptedReaderEmail: undefined,
    })))
}

export async function getRevenueSummary(publisherId: string) {
  const rows = await db
    .select()
    .from(readerTransactions)
    .where(and(
      eq(readerTransactions.publisherId, publisherId),
      eq(readerTransactions.status, "completed"),
    ))

  const total   = rows.reduce((s, r) => s + r.amount, 0)
  const subs    = rows.filter(r => r.type === "subscription").reduce((s, r) => s + r.amount, 0)
  const unlocks = rows.filter(r => r.type === "one_time_unlock").reduce((s, r) => s + r.amount, 0)
  const pending = await db
    .select()
    .from(readerTransactions)
    .where(and(eq(readerTransactions.publisherId, publisherId), eq(readerTransactions.status, "pending")))
  const failed = await db
    .select()
    .from(readerTransactions)
    .where(and(eq(readerTransactions.publisherId, publisherId), eq(readerTransactions.status, "failed")))

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const recent = rows.filter(r => r.createdAt >= thirtyDaysAgo)
  const recentTotal = recent.reduce((s, r) => s + r.amount, 0)

  return { total, subs, unlocks, recentTotal, count: rows.length, pendingCount: pending.length, failedCount: failed.length }
}

export async function createPendingReaderTransaction(input: {
  publisherId: string
  domainId?: string | null
  readerId?: string | null
  type: "subscription" | "one_time_unlock"
  amount: number
  currency?: string
  razorpayOrderId?: string | null
  razorpaySubscriptionId?: string | null
  contentUrl?: string | null
  readerEmail?: string | null
  metadata?: Record<string, unknown>
}) {
  const email = input.readerEmail ? normalizeReaderEmail(input.readerEmail) : null
  const [row] = await db.insert(readerTransactions).values({
    publisherId: input.publisherId,
    domainId: input.domainId ?? undefined,
    readerId: input.readerId ?? undefined,
    type: input.type,
    status: "pending",
    amount: input.amount,
    currency: input.currency ?? "INR",
    razorpayOrderId: input.razorpayOrderId ?? undefined,
    razorpaySubscriptionId: input.razorpaySubscriptionId ?? undefined,
    contentUrl: input.contentUrl ?? undefined,
    readerEmailHash: email ? hashReaderEmail(email) : undefined,
    encryptedReaderEmail: email ? encrypt(email) : undefined,
    metadata: input.metadata ?? {},
  }).returning()
  return row
}

export async function markReaderTransactionCompleted(input: {
  publisherId: string
  brandId?: string | null
  razorpayPaymentId: string
  razorpayOrderId?: string | null
  razorpaySubscriptionId?: string | null
  amount?: number
  currency?: string
  domainId?: string | null
  readerId?: string | null
  readerEmail?: string | null
  contentUrl?: string | null
  metadata?: Record<string, unknown>
}) {
  const existing = await db
    .select()
    .from(readerTransactions)
    .where(and(
      eq(readerTransactions.publisherId, input.publisherId),
      or(...([
        eq(readerTransactions.razorpayPaymentId, input.razorpayPaymentId),
        input.razorpayOrderId ? eq(readerTransactions.razorpayOrderId, input.razorpayOrderId) : null,
        input.razorpaySubscriptionId ? eq(readerTransactions.razorpaySubscriptionId, input.razorpaySubscriptionId) : null,
      ].filter(Boolean) as SQL[]))!,
    ))
    .limit(1)

  const email = input.readerEmail ? normalizeReaderEmail(input.readerEmail) : null
  const patch = {
    status: "completed" as const,
    razorpayPaymentId: input.razorpayPaymentId,
    razorpayOrderId: input.razorpayOrderId ?? existing[0]?.razorpayOrderId ?? null,
    razorpaySubscriptionId: input.razorpaySubscriptionId ?? existing[0]?.razorpaySubscriptionId ?? null,
    amount: input.amount ?? existing[0]?.amount ?? 0,
    currency: input.currency ?? existing[0]?.currency ?? "INR",
    brandId: input.brandId ?? existing[0]?.brandId ?? null,
    domainId: input.domainId ?? existing[0]?.domainId ?? null,
    readerId: input.readerId ?? existing[0]?.readerId ?? null,
    contentUrl: input.contentUrl ?? existing[0]?.contentUrl ?? null,
    readerEmailHash: email ? hashReaderEmail(email) : existing[0]?.readerEmailHash ?? null,
    encryptedReaderEmail: email ? encrypt(email) : existing[0]?.encryptedReaderEmail ?? null,
    failureReason: null,
    metadata: { ...((existing[0]?.metadata as Record<string, unknown> | undefined) ?? {}), ...(input.metadata ?? {}) },
    updatedAt: new Date(),
    completedAt: new Date(),
  }

  if (existing.length > 0) {
    const [row] = await db
      .update(readerTransactions)
      .set(patch)
      .where(eq(readerTransactions.id, existing[0].id))
      .returning()
    return { row, alreadyRecorded: existing[0].status === "completed" }
  }

  const [row] = await db.insert(readerTransactions).values({
    publisherId: input.publisherId,
    type: input.razorpaySubscriptionId ? "subscription" : "one_time_unlock",
    ...patch,
  }).returning()
  return { row, alreadyRecorded: false }
}

export async function markReaderTransactionFailed(input: {
  publisherId: string
  type: "subscription" | "one_time_unlock"
  amount?: number
  currency?: string
  razorpayPaymentId?: string | null
  razorpayOrderId?: string | null
  razorpaySubscriptionId?: string | null
  readerId?: string | null
  readerEmail?: string | null
  contentUrl?: string | null
  failureReason?: string | null
  metadata?: Record<string, unknown>
}) {
  const idConditions = [
    input.razorpayPaymentId ? eq(readerTransactions.razorpayPaymentId, input.razorpayPaymentId) : null,
    input.razorpayOrderId ? eq(readerTransactions.razorpayOrderId, input.razorpayOrderId) : null,
    input.razorpaySubscriptionId ? eq(readerTransactions.razorpaySubscriptionId, input.razorpaySubscriptionId) : null,
  ].filter(Boolean) as SQL[]

  const existing = idConditions.length > 0
    ? await db
      .select()
      .from(readerTransactions)
      .where(and(eq(readerTransactions.publisherId, input.publisherId), or(...idConditions)!))
      .limit(1)
    : []

  const email = input.readerEmail ? normalizeReaderEmail(input.readerEmail) : null
  const patch = {
    status: "failed" as const,
    amount: input.amount ?? existing[0]?.amount ?? 0,
    currency: input.currency ?? existing[0]?.currency ?? "INR",
    razorpayPaymentId: input.razorpayPaymentId ?? existing[0]?.razorpayPaymentId ?? null,
    razorpayOrderId: input.razorpayOrderId ?? existing[0]?.razorpayOrderId ?? null,
    razorpaySubscriptionId: input.razorpaySubscriptionId ?? existing[0]?.razorpaySubscriptionId ?? null,
    readerId: input.readerId ?? existing[0]?.readerId ?? null,
    contentUrl: input.contentUrl ?? existing[0]?.contentUrl ?? null,
    readerEmailHash: email ? hashReaderEmail(email) : existing[0]?.readerEmailHash ?? null,
    encryptedReaderEmail: email ? encrypt(email) : existing[0]?.encryptedReaderEmail ?? null,
    failureReason: input.failureReason ?? "Payment failed",
    metadata: { ...((existing[0]?.metadata as Record<string, unknown> | undefined) ?? {}), ...(input.metadata ?? {}) },
    updatedAt: new Date(),
  }

  if (existing.length > 0) {
    const [row] = await db.update(readerTransactions).set(patch).where(eq(readerTransactions.id, existing[0].id)).returning()
    return row
  }

  const [row] = await db.insert(readerTransactions).values({
    publisherId: input.publisherId,
    type: input.type,
    ...patch,
  }).returning()
  return row
}

// Total completed-revenue and currency for a publisher (optionally narrowed to a
// single domain) within a window. Used by Analytics summary stats.
export async function getRevenueForPeriod(publisherId: string, since: Date, domainId?: string) {
  const conditions = [
    eq(readerTransactions.publisherId, publisherId),
    eq(readerTransactions.status, "completed"),
    gte(readerTransactions.createdAt, since),
  ]
  if (domainId) conditions.push(eq(readerTransactions.domainId, domainId))

  const rows = await db
    .select({
      amount:   readerTransactions.amount,
      currency: readerTransactions.currency,
    })
    .from(readerTransactions)
    .where(and(...conditions))

  const total = rows.reduce((s, r) => s + r.amount, 0)
  const currency = rows[0]?.currency ?? "INR"
  return { total, currency, count: rows.length }
}

// Per-domain completed revenue in one query — for the overview domain table
export async function getRevenueByDomain(publisherId: string, domainIds: string[], since: Date): Promise<Record<string, { total: number; currency: string }>> {
  if (domainIds.length === 0) return {}

  const domainFilter = domainIds.length === 1
    ? eq(readerTransactions.domainId, domainIds[0])
    : inArray(readerTransactions.domainId, domainIds)

  const rows = await db
    .select({
      domainId: readerTransactions.domainId,
      amount:   readerTransactions.amount,
      currency: readerTransactions.currency,
    })
    .from(readerTransactions)
    .where(and(
      eq(readerTransactions.publisherId, publisherId),
      eq(readerTransactions.status, "completed"),
      gte(readerTransactions.createdAt, since),
      domainFilter,
    ))

  const result: Record<string, { total: number; currency: string }> = {}
  for (const r of rows) {
    if (!r.domainId) continue
    if (!result[r.domainId]) result[r.domainId] = { total: 0, currency: r.currency }
    result[r.domainId].total += r.amount
  }
  return result
}
