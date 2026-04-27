import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { pgWebhookEvents, plans } from "@/lib/db/schema"
import { findSubscriptionByRazorpayId, updateSubscription } from "@/lib/db/queries/billing"
import { fetchPlatformSubscription } from "@/lib/payments/billing"

// Platform-level Razorpay webhook for OnePaywall billing. Distinct from
// /api/webhooks/publisher/[publisherId] which handles each publisher's own
// reader payments.
//
// The webhook secret is generated when you register the URL in the Razorpay
// dashboard. For local dev, use ngrok ('ngrok http 3000') and set the URL to
// https://<your-tunnel>/api/webhooks/billing. Until the secret is set the
// route returns 503 — synchronous verify-after-checkout (in /api/billing
// ?action=verify) keeps the happy path working without it.
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_PLATFORM_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: "billing webhook not configured (RAZORPAY_PLATFORM_WEBHOOK_SECRET unset)" },
      { status: 503 },
    )
  }

  const rawBody  = await req.text()
  const provided = req.headers.get("x-razorpay-signature") ?? ""
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex")
  if (expected !== provided) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 })
  }

  let event: { event?: string; id?: string; payload?: Record<string, unknown> }
  try { event = JSON.parse(rawBody) } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  const eventId   = event.id ?? null
  const eventType = event.event ?? null

  // Replay protection — same shape as the per-publisher webhook.
  if (eventId && eventType) {
    const existing = await db
      .select({ id: pgWebhookEvents.id })
      .from(pgWebhookEvents)
      .where(and(
        eq(pgWebhookEvents.provider, "razorpay"),
        eq(pgWebhookEvents.eventId, eventId),
      ))
      .limit(1)
    if (existing.length > 0) return NextResponse.json({ ok: true, replay: true })
  }

  try {
    if (eventType?.startsWith("subscription.")) await handleSubscriptionEvent(eventType, event.payload ?? {})
  } catch (e) {
    console.error("billing webhook handler failed:", e)
  }

  if (eventId && eventType) {
    await db.insert(pgWebhookEvents).values({
      provider:    "razorpay",
      eventId,
      eventType,
      payload:     event.payload ?? {},
      // publisherId left null — platform events aren't tied to a publisher's PG.
    }).onConflictDoNothing()
  }

  return NextResponse.json({ ok: true })
}

async function handleSubscriptionEvent(eventType: string, payload: Record<string, unknown>) {
  const subEntity = (payload as { subscription?: { entity?: Record<string, unknown> } }).subscription?.entity
  if (!subEntity) return

  const razorpaySubId = typeof subEntity.id === "string" ? subEntity.id : null
  if (!razorpaySubId) return

  const ours = await findSubscriptionByRazorpayId(razorpaySubId)
  if (!ours) return // unknown sub — likely an event for a publisher we lost track of

  // Pull authoritative state from Razorpay rather than trusting the webhook
  // payload (which can be partial or out-of-order).
  const remote = await fetchPlatformSubscription(razorpaySubId)
  if (!remote) return

  // Map Razorpay status → our internal status. Razorpay states:
  // created, authenticated, active, pending, halted, cancelled, completed, expired
  let nextStatus: typeof ours.status = ours.status
  switch (remote.status) {
    case "active":         nextStatus = "active";   break
    case "authenticated":  nextStatus = "active";   break // mandate set up, first charge imminent
    case "pending":        nextStatus = "past_due"; break
    case "halted":         nextStatus = "past_due"; break // dunning failed; admin intervention
    case "cancelled":      nextStatus = "cancelled"; break
    case "completed":      nextStatus = "cancelled"; break // hit total_count, no more renewals
    case "expired":        nextStatus = "cancelled"; break
  }

  // First entry into past_due triggers the dunning clock (7-day soft window).
  const enteringPastDue = nextStatus === "past_due" && ours.status !== "past_due"
  const dunningStartedAt = enteringPastDue ? new Date() : (nextStatus === "past_due" ? ours.dunningStartedAt : null)

  // If we now think the user has switched plans on Razorpay's side, mirror it.
  let nextPlanSlug = ours.planSlug
  if (remote.planId) {
    const [matched] = await db.select().from(plans).where(eq(plans.razorpayPlanId, remote.planId)).limit(1)
    if (matched) nextPlanSlug = matched.slug
  }

  await updateSubscription(ours.id, {
    status:             nextStatus,
    planSlug:           nextPlanSlug,
    currentPeriodStart: remote.currentStart,
    currentPeriodEnd:   remote.currentEnd,
    cancelledAt:        nextStatus === "cancelled" ? new Date() : ours.cancelledAt,
    dunningStartedAt,
  })
}
