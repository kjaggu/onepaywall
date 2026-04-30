import { db } from "@/lib/db/client"
import { gateUnlocks, publishers } from "@/lib/db/schema"
import { markReaderTransactionCompleted } from "@/lib/db/queries/transactions"
import { eq } from "drizzle-orm"

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
  readerEmail?: string | null
}

// Single source of truth for "reader paid → close the loop".
// Writes gate_unlocks (so the gate is bypassed on next visit) AND reader_transactions
// (so revenue surfaces in the publisher dashboard). Idempotent on razorpayPaymentId so
// the verify route and the webhook can both call this without producing duplicates.
export async function recordSuccessfulUnlock(input: RecordUnlockInput): Promise<{ alreadyRecorded: boolean }> {
  const [pub] = await db
    .select({ currency: publishers.currency })
    .from(publishers)
    .where(eq(publishers.id, input.publisherId))
    .limit(1)
  const currency = pub?.currency ?? "INR"

  const result = await markReaderTransactionCompleted({
    publisherId:       input.publisherId,
    domainId:          input.domainId ?? null,
    readerId:          input.readerId,
    amount:            input.amountInPaise,
    currency,
    razorpayPaymentId: input.razorpayPaymentId,
    razorpayOrderId:   input.razorpayOrderId,
    contentUrl:        input.contentUrl ?? null,
    readerEmail:       input.readerEmail ?? null,
    metadata:          {
      gateId: input.gateId,
      domainId: input.domainId,
      contentUrl: input.contentUrl,
    },
  })

  if (result.alreadyRecorded) return { alreadyRecorded: true }

  await db.insert(gateUnlocks).values({
    readerId: input.readerId,
    gateId: input.gateId,
    contentId: input.contentId ?? undefined,
    unlockType: "one_time_payment",
    expiresAt: input.unlockExpiresAt ?? undefined,
  })

  return { alreadyRecorded: result.alreadyRecorded }
}
