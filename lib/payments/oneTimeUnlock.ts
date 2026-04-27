import Razorpay from "razorpay"
import { createHmac } from "crypto"
import { resolveConfig } from "@/lib/payments/resolveConfig"

export type OrderResult = {
  orderId: string
  keyId: string
  amount: number
  currency: string
}

export type OrderNotes = {
  gateId: string
  readerToken: string
  stepId?: string
  contentUrl?: string
}

export async function createUnlockOrder(
  publisherId: string,
  amountInPaise: number,
  receiptId: string,
  notes: OrderNotes,
): Promise<OrderResult> {
  const cfg = await resolveConfig(publisherId)
  const rzp = new Razorpay({ key_id: cfg.keyId, key_secret: cfg.keySecret })

  const order = await rzp.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: receiptId,
    payment_capture: true,
    notes: notes as unknown as Record<string, string>,
  })

  return {
    orderId: order.id,
    keyId: cfg.keyId,
    amount: amountInPaise,
    currency: "INR",
  }
}

export async function verifyPaymentSignature(
  publisherId: string,
  orderId: string,
  paymentId: string,
  signature: string,
): Promise<boolean> {
  const cfg = await resolveConfig(publisherId)
  const expected = createHmac("sha256", cfg.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex")
  return expected === signature
}

export type FetchedOrder = {
  amount: number
  currency: string
  notes: Partial<OrderNotes>
}

export async function fetchOrder(publisherId: string, orderId: string): Promise<FetchedOrder | null> {
  const cfg = await resolveConfig(publisherId)
  const rzp = new Razorpay({ key_id: cfg.keyId, key_secret: cfg.keySecret })
  try {
    const order = await rzp.orders.fetch(orderId)
    return {
      amount: Number(order.amount),
      currency: String(order.currency ?? "INR"),
      notes: (order.notes ?? {}) as Partial<OrderNotes>,
    }
  } catch {
    return null
  }
}
