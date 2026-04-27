import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { gateUnlocks, publishers, readerTransactions } from "@/lib/db/schema"

type RecordUnlockInput = {
  publisherId: string
  domainId: string | null
  readerId: string
  gateId: string
  razorpayPaymentId: string
  razorpayOrderId: string
  amountInPaise: number
  contentUrl?: string | null
  contentId?: string | null
  unlockExpiresAt?: Date | null
}

// Single source of truth for "reader paid → close the loop".
// Writes gate_unlocks (so the gate is bypassed on next visit) AND reader_transactions
// (so revenue surfaces in the publisher dashboard). Idempotent on razorpayPaymentId so
// the verify route and the webhook can both call this without producing duplicates.
export async function recordSuccessfulUnlock(input: RecordUnlockInput): Promise<{ alreadyRecorded: boolean }> {
  const existing = await db
    .select({ id: readerTransactions.id })
    .from(readerTransactions)
    .where(eq(readerTransactions.razorpayPaymentId, input.razorpayPaymentId))
    .limit(1)

  if (existing.length > 0) return { alreadyRecorded: true }

  const [pub] = await db
    .select({ currency: publishers.currency })
    .from(publishers)
    .where(eq(publishers.id, input.publisherId))
    .limit(1)
  const currency = pub?.currency ?? "INR"

  await db.insert(gateUnlocks).values({
    readerId: input.readerId,
    gateId: input.gateId,
    contentId: input.contentId ?? undefined,
    unlockType: "one_time_payment",
    expiresAt: input.unlockExpiresAt ?? undefined,
  })

  await db.insert(readerTransactions).values({
    publisherId:       input.publisherId,
    domainId:          input.domainId ?? undefined,
    readerId:          input.readerId,
    type:              "one_time_unlock",
    status:            "completed",
    amount:            input.amountInPaise,
    currency,
    razorpayPaymentId: input.razorpayPaymentId,
    razorpayOrderId:   input.razorpayOrderId,
    contentUrl:        input.contentUrl ?? undefined,
    metadata:          { gateId: input.gateId },
  })

  return { alreadyRecorded: false }
}
