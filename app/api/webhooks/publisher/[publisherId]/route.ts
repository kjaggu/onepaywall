import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { domains, pgWebhookEvents, readerTokens } from "@/lib/db/schema"
import { resolveConfig } from "@/lib/payments/resolveConfig"
import { fetchOrder } from "@/lib/payments/oneTimeUnlock"
import { recordSuccessfulUnlock } from "@/lib/payments/recordUnlock"

// POST /api/webhooks/publisher/[publisherId]
// Razorpay sends payment events here. Register this URL in the publisher's Razorpay dashboard.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ publisherId: string }> },
) {
  const { publisherId } = await params

  const rawBody = await req.text()
  const razorpaySignature = req.headers.get("x-razorpay-signature") ?? ""

  const cfg = await resolveConfig(publisherId)
  if (!cfg.webhookSecret) {
    return NextResponse.json({ error: "webhook secret not configured" }, { status: 500 })
  }

  const expected = createHmac("sha256", cfg.webhookSecret)
    .update(rawBody)
    .digest("hex")

  if (expected !== razorpaySignature) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 })
  }

  let event: { event?: string; id?: string; payload?: Record<string, unknown> }
  try { event = JSON.parse(rawBody) } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  const eventId   = event.id ?? null
  const eventType = event.event ?? null

  // Idempotency: drop the request if we've already processed this Razorpay event.
  if (eventId && eventType) {
    const existing = await db
      .select({ id: pgWebhookEvents.id })
      .from(pgWebhookEvents)
      .where(and(
        eq(pgWebhookEvents.provider, "razorpay"),
        eq(pgWebhookEvents.publisherId, publisherId),
        eq(pgWebhookEvents.eventId, eventId),
      ))
      .limit(1)

    if (existing.length > 0) return NextResponse.json({ ok: true, replay: true })
  }

  if (eventType === "payment.captured") {
    await handlePaymentCaptured(publisherId, event.payload ?? {})
  }

  if (eventId && eventType) {
    await db.insert(pgWebhookEvents).values({
      publisherId,
      provider:  "razorpay",
      eventId,
      eventType,
      payload:   event.payload ?? {},
    }).onConflictDoNothing()
  }

  return NextResponse.json({ ok: true })
}

async function handlePaymentCaptured(publisherId: string, payload: Record<string, unknown>) {
  const payment = (payload as { payment?: { entity?: Record<string, unknown> } }).payment?.entity
  if (!payment) return

  const notes = payment.notes as Record<string, string> | undefined
  const gateId      = notes?.gateId
  const readerToken = notes?.readerToken
  const orderId     = typeof payment.order_id === "string" ? payment.order_id : null
  const paymentId   = typeof payment.id === "string" ? payment.id : null

  if (!gateId || !readerToken || !orderId || !paymentId) return

  // Look up the reader + their domain for this token.
  const [rt] = await db
    .select({
      readerId: readerTokens.readerId,
      domainId: readerTokens.domainId,
      domainPublisherId: domains.publisherId,
    })
    .from(readerTokens)
    .leftJoin(domains, eq(readerTokens.domainId, domains.id))
    .where(eq(readerTokens.token, readerToken))
    .limit(1)

  if (!rt || rt.domainPublisherId !== publisherId) return

  // Fetch order from Razorpay for the authoritative amount + notes.
  const order = await fetchOrder(publisherId, orderId)
  if (!order) return

  await recordSuccessfulUnlock({
    publisherId,
    domainId:          rt.domainId,
    readerId:          rt.readerId,
    gateId,
    razorpayPaymentId: paymentId,
    razorpayOrderId:   orderId,
    amountInPaise:     order.amount,
    contentUrl:        order.notes.contentUrl ?? null,
  })
}
