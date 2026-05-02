import { db } from "@/lib/db/client"
import { publisherInvoices, readerTransactions, publishers, domains } from "@/lib/db/schema"
import { eq, and, desc, sql } from "drizzle-orm"
import { decrypt, encrypt } from "@/lib/payments/encrypt"

export type InvoiceRow = {
  id: string
  publisherId: string
  publisherName: string
  transactionId: string | null
  domainId: string | null
  domainHost: string | null
  invoiceNumber: number
  invoiceRef: string        // e.g. "INV-2025-0001"
  type: string
  amount: number
  currency: string
  readerEmail: string | null
  readerEmailHash: string | null
  contentUrl: string | null
  razorpayPaymentId: string | null
  issuedAt: Date
  createdAt: Date
}

function invoiceRef(issuedAt: Date, invoiceNumber: number): string {
  return `INV-${issuedAt.getFullYear()}-${String(invoiceNumber).padStart(4, "0")}`
}

function toRow(r: {
  id: string
  publisherId: string
  publisherName: string
  transactionId: string | null
  domainId: string | null
  domainHost: string | null
  invoiceNumber: number
  type: string
  amount: number
  currency: string
  readerEmailHash: string | null
  encryptedReaderEmail: string | null
  contentUrl: string | null
  razorpayPaymentId: string | null
  issuedAt: Date
  createdAt: Date
}): InvoiceRow {
  return {
    ...r,
    invoiceRef: invoiceRef(r.issuedAt, r.invoiceNumber),
    readerEmail: r.encryptedReaderEmail ? decrypt(r.encryptedReaderEmail) : null,
  }
}

export async function listInvoices(publisherId: string): Promise<InvoiceRow[]> {
  const rows = await db
    .select({
      id:                   publisherInvoices.id,
      publisherId:          publisherInvoices.publisherId,
      publisherName:        publishers.name,
      transactionId:        publisherInvoices.transactionId,
      domainId:             publisherInvoices.domainId,
      domainHost:           domains.domain,
      invoiceNumber:        publisherInvoices.invoiceNumber,
      type:                 publisherInvoices.type,
      amount:               publisherInvoices.amount,
      currency:             publisherInvoices.currency,
      readerEmailHash:      publisherInvoices.readerEmailHash,
      encryptedReaderEmail: publisherInvoices.encryptedReaderEmail,
      contentUrl:           publisherInvoices.contentUrl,
      razorpayPaymentId:    publisherInvoices.razorpayPaymentId,
      issuedAt:             publisherInvoices.issuedAt,
      createdAt:            publisherInvoices.createdAt,
    })
    .from(publisherInvoices)
    .innerJoin(publishers, eq(publisherInvoices.publisherId, publishers.id))
    .leftJoin(domains, eq(publisherInvoices.domainId, domains.id))
    .where(eq(publisherInvoices.publisherId, publisherId))
    .orderBy(desc(publisherInvoices.invoiceNumber))
    .limit(200)

  return rows.map(toRow)
}

export async function getInvoice(invoiceId: string, publisherId: string): Promise<InvoiceRow | null> {
  const [row] = await db
    .select({
      id:                   publisherInvoices.id,
      publisherId:          publisherInvoices.publisherId,
      publisherName:        publishers.name,
      transactionId:        publisherInvoices.transactionId,
      domainId:             publisherInvoices.domainId,
      domainHost:           domains.domain,
      invoiceNumber:        publisherInvoices.invoiceNumber,
      type:                 publisherInvoices.type,
      amount:               publisherInvoices.amount,
      currency:             publisherInvoices.currency,
      readerEmailHash:      publisherInvoices.readerEmailHash,
      encryptedReaderEmail: publisherInvoices.encryptedReaderEmail,
      contentUrl:           publisherInvoices.contentUrl,
      razorpayPaymentId:    publisherInvoices.razorpayPaymentId,
      issuedAt:             publisherInvoices.issuedAt,
      createdAt:            publisherInvoices.createdAt,
    })
    .from(publisherInvoices)
    .innerJoin(publishers, eq(publisherInvoices.publisherId, publishers.id))
    .leftJoin(domains, eq(publisherInvoices.domainId, domains.id))
    .where(and(eq(publisherInvoices.id, invoiceId), eq(publisherInvoices.publisherId, publisherId)))
    .limit(1)

  return row ? toRow(row) : null
}

// Returns existing invoice for a transaction, or creates a new one.
export async function getOrCreateInvoiceForTransaction(
  publisherId: string,
  transactionId: string,
): Promise<InvoiceRow> {
  // Check if already exists
  const [existing] = await db
    .select({
      id:                   publisherInvoices.id,
      publisherId:          publisherInvoices.publisherId,
      publisherName:        publishers.name,
      transactionId:        publisherInvoices.transactionId,
      domainId:             publisherInvoices.domainId,
      domainHost:           domains.domain,
      invoiceNumber:        publisherInvoices.invoiceNumber,
      type:                 publisherInvoices.type,
      amount:               publisherInvoices.amount,
      currency:             publisherInvoices.currency,
      readerEmailHash:      publisherInvoices.readerEmailHash,
      encryptedReaderEmail: publisherInvoices.encryptedReaderEmail,
      contentUrl:           publisherInvoices.contentUrl,
      razorpayPaymentId:    publisherInvoices.razorpayPaymentId,
      issuedAt:             publisherInvoices.issuedAt,
      createdAt:            publisherInvoices.createdAt,
    })
    .from(publisherInvoices)
    .innerJoin(publishers, eq(publisherInvoices.publisherId, publishers.id))
    .leftJoin(domains, eq(publisherInvoices.domainId, domains.id))
    .where(and(
      eq(publisherInvoices.transactionId, transactionId),
      eq(publisherInvoices.publisherId, publisherId),
    ))
    .limit(1)

  if (existing) return toRow(existing)

  // Load the transaction
  const [tx] = await db
    .select()
    .from(readerTransactions)
    .where(and(eq(readerTransactions.id, transactionId), eq(readerTransactions.publisherId, publisherId)))
    .limit(1)

  if (!tx) throw new Error("Transaction not found")
  if (tx.status !== "completed") throw new Error("Can only invoice completed transactions")

  // Next invoice number for this publisher
  const [numRow] = await db
    .select({ maxNum: sql<number>`COALESCE(MAX(${publisherInvoices.invoiceNumber}), 0)` })
    .from(publisherInvoices)
    .where(eq(publisherInvoices.publisherId, publisherId))

  const nextNumber = (Number(numRow?.maxNum ?? 0)) + 1

  const [created] = await db
    .insert(publisherInvoices)
    .values({
      publisherId,
      transactionId,
      domainId:             tx.domainId,
      invoiceNumber:        nextNumber,
      type:                 tx.type,
      amount:               tx.amount,
      currency:             tx.currency,
      readerEmailHash:      tx.readerEmailHash,
      encryptedReaderEmail: tx.encryptedReaderEmail,
      contentUrl:           tx.contentUrl,
      razorpayPaymentId:    tx.razorpayPaymentId,
    })
    .returning()

  // Re-fetch with joins so we get publisherName + domainHost
  return (await getInvoice(created.id, publisherId))!
}
