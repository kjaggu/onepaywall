import { db } from "@/lib/db/client"
import { readerTransactions, domains } from "@/lib/db/schema"
import { eq, and, gte, lte, desc } from "drizzle-orm"

export type TransactionFilter = {
  type?: "subscription" | "one_time_unlock"
  status?: "pending" | "completed" | "refunded" | "failed"
  domainId?: string
  from?: Date
  to?: Date
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
      contentUrl:        readerTransactions.contentUrl,
      readerId:          readerTransactions.readerId,
      domainId:          readerTransactions.domainId,
      createdAt:         readerTransactions.createdAt,
      domainName:        domains.name,
      domainHost:        domains.domain,
    })
    .from(readerTransactions)
    .leftJoin(domains, eq(readerTransactions.domainId, domains.id))
    .where(and(...conditions))
    .orderBy(desc(readerTransactions.createdAt))
    .limit(500)
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

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const recent = rows.filter(r => r.createdAt >= thirtyDaysAgo)
  const recentTotal = recent.reduce((s, r) => s + r.amount, 0)

  return { total, subs, unlocks, recentTotal, count: rows.length }
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
