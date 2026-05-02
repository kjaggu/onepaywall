import Razorpay from "razorpay"
import { resolveConfig } from "@/lib/payments/resolveConfig"
import { getDigitalProduct } from "@/lib/db/queries/digital-products"

export type DownloadOrderResult = {
  orderId: string
  keyId: string
  amount: number
  currency: string
  productTitle: string
}

export async function createDownloadOrder(input: {
  publisherId: string
  productId: string
  gateId: string
  readerToken: string
  stepId: string
}): Promise<DownloadOrderResult> {
  const product = await getDigitalProduct(input.productId)
  if (!product || !product.active) throw new Error("product_not_found")

  const cfg = await resolveConfig(input.publisherId)
  const rzp = new Razorpay({ key_id: cfg.keyId, key_secret: cfg.keySecret })

  const receiptId = `dp_${input.productId.slice(0, 8)}_${Date.now()}`
  const order = await rzp.orders.create({
    amount: product.priceInPaise,
    currency: "INR",
    receipt: receiptId,
    payment_capture: true,
    notes: {
      productId: input.productId,
      gateId: input.gateId,
      readerToken: input.readerToken,
      stepId: input.stepId,
    } as unknown as Record<string, string>,
  })

  return {
    orderId: order.id,
    keyId: cfg.keyId,
    amount: product.priceInPaise,
    currency: "INR",
    productTitle: product.title,
  }
}
