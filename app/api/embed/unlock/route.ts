import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { domains, gateSteps } from "@/lib/db/schema"
import { getReaderByToken } from "@/lib/embed/readerToken"
import {
  createUnlockOrder,
  fetchOrder,
  verifyPaymentSignature,
} from "@/lib/payments/oneTimeUnlock"
import { recordSuccessfulUnlock } from "@/lib/payments/recordUnlock"
import { resolveUnlockPrice } from "@/lib/payments/resolveUnlockPrice"
import { createPendingReaderTransaction, markReaderTransactionFailed } from "@/lib/db/queries/transactions"

// POST /api/embed/unlock?action=create — create a Razorpay order for a one-time unlock step
// POST /api/embed/unlock?action=verify — verify payment signature and write gate_unlock + transaction
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action") ?? "create"

  if (action === "create") return handleCreate(req)
  if (action === "verify") return handleVerify(req)
  return NextResponse.json({ error: "unknown action" }, { status: 400 })
}

async function handleCreate(req: NextRequest) {
  let body: { token?: string; gateId?: string; stepId?: string; url?: string; email?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  const { token, gateId, stepId, url: pageUrl, email } = body
  if (!token || !gateId || !stepId) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 })
  }

  const reader = await getReaderByToken(token)
  if (!reader) return NextResponse.json({ error: "invalid token" }, { status: 401 })

  const [domain] = await db
    .select({ publisherId: domains.publisherId })
    .from(domains)
    .where(eq(domains.id, reader.domainId))
    .limit(1)
  if (!domain) return NextResponse.json({ error: "domain not found" }, { status: 404 })

  const [step] = await db
    .select({ config: gateSteps.config })
    .from(gateSteps)
    .where(eq(gateSteps.id, stepId))
    .limit(1)
  if (!step) return NextResponse.json({ error: "step not found" }, { status: 404 })

  const stepCfg = step.config as { priceInPaise?: number }
  const resolved = await resolveUnlockPrice({
    publisherId: domain.publisherId,
    pageUrl: pageUrl ?? null,
    stepConfigPriceInPaise: stepCfg.priceInPaise ?? null,
  })

  if (!resolved) return NextResponse.json({ error: "no price configured" }, { status: 400 })

  const receiptId = `opw_${reader.readerId.slice(0, 8)}_${gateId.slice(0, 8)}_${Date.now()}`

  try {
    const order = await createUnlockOrder(domain.publisherId, resolved.amountInPaise, receiptId, {
      gateId,
      readerToken: token,
      stepId,
      contentUrl: pageUrl,
    })
    await createPendingReaderTransaction({
      publisherId: domain.publisherId,
      domainId: reader.domainId,
      readerId: reader.readerId,
      type: "one_time_unlock",
      amount: resolved.amountInPaise,
      currency: order.currency,
      razorpayOrderId: order.orderId,
      contentUrl: pageUrl,
      readerEmail: email ?? null,
      metadata: { gateId, stepId },
    })
    return NextResponse.json(order)
  } catch (e) {
    console.error("Razorpay order creation failed:", e)
    return NextResponse.json({ error: "payment provider error" }, { status: 502 })
  }
}

async function handleVerify(req: NextRequest) {
  let body: {
    token?: string
    gateId?: string
    orderId?: string
    paymentId?: string
    signature?: string
    email?: string
  }
  try { body = await req.json() } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  const { token, gateId, orderId, paymentId, signature, email } = body
  if (!token || !gateId || !orderId || !paymentId || !signature) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 })
  }

  const reader = await getReaderByToken(token)
  if (!reader) return NextResponse.json({ error: "invalid token" }, { status: 401 })

  const [domain] = await db
    .select({ publisherId: domains.publisherId })
    .from(domains)
    .where(eq(domains.id, reader.domainId))
    .limit(1)
  if (!domain) return NextResponse.json({ error: "domain not found" }, { status: 404 })

  const valid = await verifyPaymentSignature(domain.publisherId, orderId, paymentId, signature)
  if (!valid) {
    await markReaderTransactionFailed({
      publisherId: domain.publisherId,
      type: "one_time_unlock",
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
      readerId: reader.readerId,
      readerEmail: email ?? null,
      failureReason: "Invalid Razorpay signature",
      metadata: { gateId },
    })
    return NextResponse.json({ error: "invalid signature" }, { status: 400 })
  }

  // Fetch the order from Razorpay so amount + contentUrl are taken from the
  // authoritative source — never from the client.
  const order = await fetchOrder(domain.publisherId, orderId)
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 502 })

  await recordSuccessfulUnlock({
    publisherId:       domain.publisherId,
    domainId:          reader.domainId,
    readerId:          reader.readerId,
    gateId,
    razorpayPaymentId: paymentId,
    razorpayOrderId:   orderId,
    amountInPaise:     order.amount,
    contentUrl:        order.notes.contentUrl ?? null,
    readerEmail:       email ?? null,
  })

  return NextResponse.json({ ok: true })
}
