import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { publishers } from "@/lib/db/schema"
import {
  getReaderSubscriptionByRazorpayId,
  getSubscriberById,
  getSubscriberEmail,
  recordReaderSubscriptionPayment,
  updateReaderSubscriptionStatus,
} from "@/lib/db/queries/reader-subscriptions"
import { fetchReaderSubscription } from "@/lib/payments/readerSubscriptions"
import { markReaderTransactionFailed } from "@/lib/db/queries/transactions"
import {
  sendReaderPaymentFailed,
  sendReaderPaymentReceived,
  sendReaderSubscriptionCancelled,
  sendReaderSubscriptionHalted,
} from "@/lib/auth/email"

type RazorpayWebhookPayload = Record<string, unknown>

async function resolveSubscriberContext(subscriberId: string, publisherId: string) {
  const [subscriber, pubRow] = await Promise.all([
    getSubscriberById(subscriberId),
    db.select({ name: publishers.name }).from(publishers).where(eq(publishers.id, publisherId)).limit(1),
  ])
  if (!subscriber) return null
  return {
    email: getSubscriberEmail(subscriber),
    publisherName: pubRow[0]?.name ?? "OnePaywall",
  }
}

function subscriptionEntity(payload: RazorpayWebhookPayload) {
  return (payload as { subscription?: { entity?: Record<string, unknown> } }).subscription?.entity ?? null
}

function paymentEntity(payload: RazorpayWebhookPayload) {
  return (payload as { payment?: { entity?: Record<string, unknown> } }).payment?.entity ?? null
}

function mapSubscriptionStatus(status: string, previousStatus: string) {
  switch (status) {
    case "active":
    case "authenticated":
      return "active"
    case "pending":
    case "halted":
      return "past_due"
    case "cancelled":
    case "completed":
    case "expired":
      return "cancelled"
    case "created":
      return previousStatus
    default:
      return status || previousStatus
  }
}

export async function processReaderSubscriptionWebhook(input: {
  publisherId?: string
  eventType: string
  payload: RazorpayWebhookPayload
}) {
  const subEntity = subscriptionEntity(input.payload)
  const payment = paymentEntity(input.payload)

  const razorpaySubId =
    (typeof subEntity?.id === "string" ? subEntity.id : null) ??
    (typeof payment?.subscription_id === "string" ? payment.subscription_id : null)

  if (!razorpaySubId) return

  const ours = await getReaderSubscriptionByRazorpayId(razorpaySubId)
  if (!ours) return
  if (input.publisherId && ours.publisherId !== input.publisherId) return

  let remote: Awaited<ReturnType<typeof fetchReaderSubscription>> = null
  if (input.eventType.startsWith("subscription.")) {
    remote = await fetchReaderSubscription(ours.publisherId, razorpaySubId)
    if (remote) {
      const nextStatus = mapSubscriptionStatus(remote.status, ours.status)
      const enteringPastDue = nextStatus === "past_due" && ours.status !== "past_due"
      await updateReaderSubscriptionStatus(razorpaySubId, {
        status: nextStatus,
        currentPeriodStart: remote.currentStart,
        currentPeriodEnd: remote.currentEnd,
        cancelledAt: nextStatus === "cancelled" ? new Date() : ours.cancelledAt,
        dunningStartedAt: enteringPastDue ? new Date() : (nextStatus === "past_due" ? ours.dunningStartedAt : null),
      })
    }
  }

  if (input.eventType === "payment.captured" && payment) {
    const paymentId = typeof payment.id === "string" ? payment.id : null
    if (!paymentId) return
    await recordReaderSubscriptionPayment({
      publisherId: ours.publisherId,
      razorpayPaymentId: paymentId,
      razorpaySubscriptionId: razorpaySubId,
      amount: Number(payment.amount ?? 0),
      currency: String(payment.currency ?? "INR"),
      interval: ours.interval,
    })
  }

  if (input.eventType === "payment.failed" && payment) {
    const paymentId = typeof payment.id === "string" ? payment.id : null
    await markReaderTransactionFailed({
      publisherId: ours.publisherId,
      type: "subscription",
      razorpayPaymentId: paymentId,
      razorpaySubscriptionId: razorpaySubId,
      amount: Number(payment.amount ?? 0),
      currency: String(payment.currency ?? "INR"),
      failureReason: String(payment.error_description ?? payment.error_reason ?? "Payment failed"),
      metadata: { interval: ours.interval },
    })
  }

  // ── Transactional emails — fire-and-forget, never block webhook response ──
  resolveSubscriberContext(ours.subscriberId, ours.publisherId).then(ctx => {
    if (!ctx) return

    if (input.eventType === "subscription.charged" && payment) {
      const paymentId = typeof payment.id === "string" ? payment.id : ""
      return sendReaderPaymentReceived({
        to: ctx.email,
        publisherName: ctx.publisherName,
        interval: ours.interval,
        amountPaise: Number(payment.amount ?? 0),
        currency: String(payment.currency ?? "INR"),
        razorpayPaymentId: paymentId,
        nextRenewal: remote?.currentEnd ?? null,
      })
    }

    if (input.eventType === "payment.failed" && payment) {
      return sendReaderPaymentFailed({
        to: ctx.email,
        publisherName: ctx.publisherName,
        interval: ours.interval,
        amountPaise: Number(payment.amount ?? 0),
        currency: String(payment.currency ?? "INR"),
        reason: String(payment.error_description ?? payment.error_reason ?? "Payment failed"),
      })
    }

    if (input.eventType === "subscription.halted") {
      return sendReaderSubscriptionHalted({
        to: ctx.email,
        publisherName: ctx.publisherName,
        interval: ours.interval,
      })
    }

    if (input.eventType === "subscription.cancelled" || input.eventType === "subscription.completed") {
      return sendReaderSubscriptionCancelled({
        to: ctx.email,
        publisherName: ctx.publisherName,
        interval: ours.interval,
        currentPeriodEnd: remote?.currentEnd ?? null,
      })
    }
  }).catch(() => {})
}
