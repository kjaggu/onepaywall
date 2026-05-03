import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { domains, gateUnlocks, pgWebhookEvents, readerTokens } from "@/lib/db/schema"
import { processReaderSubscriptionWebhook } from "@/lib/payments/readerSubscriptionWebhooks"
import { markReaderTransactionCompleted, markReaderTransactionFailed } from "@/lib/db/queries/transactions"

// Platform reader-monetization webhook. This is distinct from /api/webhooks/billing,
// which is only for OnePaywall charging publishers for SaaS subscriptions.
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_READER_WEBHOOK_SECRET ?? process.env.RAZORPAY_WEBHOOK_SECRET ?? process.env.RAZORPAY_PLATFORM_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "reader webhook not configured" }, { status: 503 })

  const rawBody = await req.text()
  const provided = req.headers.get("x-razorpay-signature") ?? ""
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex")
  const signaturesMatch =
    expected.length === provided.length &&
    timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"))
  if (!signaturesMatch) return NextResponse.json({ error: "invalid signature" }, { status: 400 })

  let event: { event?: string; id?: string; payload?: Record<string, unknown> }
  try { event = JSON.parse(rawBody) } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  const eventId = event.id ?? null
  const eventType = event.event ?? null

  if (eventId && eventType) {
    const existing = await db
      .select({ id: pgWebhookEvents.id })
      .from(pgWebhookEvents)
      .where(and(eq(pgWebhookEvents.provider, "razorpay"), eq(pgWebhookEvents.eventId, eventId)))
      .limit(1)
    if (existing.length > 0) return NextResponse.json({ ok: true, replay: true })
  }

  if (eventType) {
    await processReaderSubscriptionWebhook({ eventType, payload: event.payload ?? {} })
    if (eventType === "payment.captured") await handlePlatformOneTimeCaptured(event.payload ?? {})
    if (eventType === "payment.failed") await handlePlatformOneTimeFailed(event.payload ?? {})
  }

  if (eventId && eventType) {
    await db.insert(pgWebhookEvents).values({
      provider: "razorpay",
      eventId,
      eventType,
      payload: event.payload ?? {},
    }).onConflictDoNothing()
  }

  return NextResponse.json({ ok: true })
}

async function resolveOneTimePayment(payload: Record<string, unknown>) {
  const payment = (payload as { payment?: { entity?: Record<string, unknown> } }).payment?.entity
  if (!payment) return null
  const notes = payment.notes as Record<string, string> | undefined
  const gateId = notes?.gateId
  const readerToken = notes?.readerToken
  const orderId = typeof payment.order_id === "string" ? payment.order_id : null
  const paymentId = typeof payment.id === "string" ? payment.id : null
  if (!gateId || !readerToken || !orderId) return null

  const [rt] = await db
    .select({
      readerId: readerTokens.readerId,
      domainId: readerTokens.domainId,
      publisherId: domains.publisherId,
    })
    .from(readerTokens)
    .leftJoin(domains, eq(readerTokens.domainId, domains.id))
    .where(eq(readerTokens.token, readerToken))
    .limit(1)

  if (!rt?.publisherId) return null
  return {
    payment,
    notes,
    gateId,
    orderId,
    paymentId,
    readerId: rt.readerId,
    domainId: rt.domainId,
    publisherId: rt.publisherId,
  }
}

async function handlePlatformOneTimeCaptured(payload: Record<string, unknown>) {
  const resolved = await resolveOneTimePayment(payload)
  if (!resolved?.paymentId) return

  const result = await markReaderTransactionCompleted({
    publisherId: resolved.publisherId,
    domainId: resolved.domainId,
    readerId: resolved.readerId,
    razorpayPaymentId: resolved.paymentId,
    razorpayOrderId: resolved.orderId,
    amount: Number(resolved.payment.amount ?? 0),
    currency: String(resolved.payment.currency ?? "INR"),
    contentUrl: resolved.notes?.contentUrl ?? null,
    metadata: { gateId: resolved.gateId },
  })
  if (result.alreadyRecorded) return

  await db.insert(gateUnlocks).values({
    readerId: resolved.readerId,
    gateId: resolved.gateId,
    unlockType: "one_time_payment",
  })
}

async function handlePlatformOneTimeFailed(payload: Record<string, unknown>) {
  const resolved = await resolveOneTimePayment(payload)
  if (!resolved) return
  await markReaderTransactionFailed({
    publisherId: resolved.publisherId,
    type: "one_time_unlock",
    amount: Number(resolved.payment.amount ?? 0),
    currency: String(resolved.payment.currency ?? "INR"),
    razorpayPaymentId: resolved.paymentId,
    razorpayOrderId: resolved.orderId,
    readerId: resolved.readerId,
    contentUrl: resolved.notes?.contentUrl ?? null,
    failureReason: String(resolved.payment.error_description ?? resolved.payment.error_reason ?? "Payment failed"),
    metadata: { gateId: resolved.gateId },
  })
}
