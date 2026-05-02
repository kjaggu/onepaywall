import { createHmac } from "crypto"
import { db } from "@/lib/db/client"
import { gateUnlocks, publishers } from "@/lib/db/schema"
import { resolveConfig } from "@/lib/payments/resolveConfig"
import { getDigitalProduct, incrementDownloadCount } from "@/lib/db/queries/digital-products"
import { markReaderTransactionCompleted, createPendingReaderTransaction } from "@/lib/db/queries/transactions"
import { createPresignedGetUrl } from "@/lib/digital-products/r2"
import Razorpay from "razorpay"
import { eq } from "drizzle-orm"

type RecordInput = {
  publisherId: string
  domainId: string | null
  readerId: string
  gateId: string
  productId: string
  orderId: string
  paymentId: string
  signature: string
  readerEmail?: string | null
}

type RecordResult = {
  ok: boolean
  downloadUrl?: string
  error?: string
}

export async function recordDownloadUnlock(input: RecordInput): Promise<RecordResult> {
  const cfg = await resolveConfig(input.publisherId)

  // Verify signature client-side can't forge
  const expected = createHmac("sha256", cfg.keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex")
  if (expected !== input.signature) return { ok: false, error: "invalid_signature" }

  const product = await getDigitalProduct(input.productId)
  if (!product) return { ok: false, error: "product_not_found" }

  // Fetch the order from Razorpay as authoritative amount source
  const rzp = new Razorpay({ key_id: cfg.keyId, key_secret: cfg.keySecret })
  let amount: number
  try {
    const order = await rzp.orders.fetch(input.orderId)
    amount = Number(order.amount)
  } catch {
    return { ok: false, error: "order_fetch_failed" }
  }

  const [pub] = await db
    .select({ currency: publishers.currency })
    .from(publishers)
    .where(eq(publishers.id, input.publisherId))
    .limit(1)
  const currency = pub?.currency ?? "INR"

  const result = await markReaderTransactionCompleted({
    publisherId:       input.publisherId,
    razorpayPaymentId: input.paymentId,
    razorpayOrderId:   input.orderId,
    amount,
    currency,
    domainId:          input.domainId,
    readerId:          input.readerId,
    readerEmail:       input.readerEmail ?? null,
    metadata: {
      gateId:    input.gateId,
      productId: input.productId,
      type:      "digital_product",
    },
  })

  // Idempotent: if already recorded, still return a fresh download URL
  if (!result.alreadyRecorded) {
    await db.insert(gateUnlocks).values({
      readerId:   input.readerId,
      gateId:     input.gateId,
      unlockType: "digital_product_purchase",
    })
    await incrementDownloadCount(input.productId)
  }

  try {
    const downloadUrl = createPresignedGetUrl(product.r2Key, 3600)
    return { ok: true, downloadUrl }
  } catch {
    return { ok: false, error: "r2_not_configured" }
  }
}
