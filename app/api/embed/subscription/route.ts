import { NextRequest, NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { domains, gates, publishers } from "@/lib/db/schema"
import { getReaderByToken } from "@/lib/embed/readerToken"
import { getEnabledSyncedIntervals, getPublisherReaderPlan } from "@/lib/db/queries/publisher-plans"
import { getOrCreatePgConfig } from "@/lib/db/queries/pg-configs"
import { resolveConfig } from "@/lib/payments/resolveConfig"
import {
  consumeSubscriptionMagicLink,
  createSubscriptionMagicLink,
  getOrCreateSubscriber,
  getSubscriberByEmail,
  getSubscriberById,
  getSubscriberEmail,
  linkReaderToSubscriber,
  recordReaderSubscriptionPayment,
  setSubscriberCustomerId,
  subscriberHasActiveSubscription,
  upsertReaderSubscription,
  getReaderSubscriptionByRazorpayId,
  type ReaderBillingInterval,
} from "@/lib/db/queries/reader-subscriptions"
import {
  createOrReuseReaderCustomer,
  createReaderSubscription,
  fetchReaderPayment,
  fetchReaderSubscription,
  verifyReaderSubscriptionSignature,
} from "@/lib/payments/readerSubscriptions"
import { sendReaderSubscriptionMagicLink, sendReaderSubscriptionConfirmation } from "@/lib/auth/email"
import { createPendingReaderTransaction, markReaderTransactionFailed } from "@/lib/db/queries/transactions"

const VALID_INTERVALS = new Set(["monthly", "quarterly", "annual"])

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action") ?? "create"
  if (action === "create") return handleCreate(req)
  if (action === "verify") return handleVerify(req)
  if (action === "restore-request") return handleRestoreRequest(req)
  if (action === "restore-confirm") return handleRestoreConfirm(req)
  return NextResponse.json({ error: "unknown action" }, { status: 400 })
}

async function resolveReaderPublisher(token: string, gateId?: string) {
  const reader = await getReaderByToken(token)
  if (!reader) return null

  const [domain] = await db
    .select({ publisherId: domains.publisherId, brandId: domains.brandId, domainId: domains.id })
    .from(domains)
    .where(eq(domains.id, reader.domainId))
    .limit(1)
  if (!domain) return null

  if (gateId) {
    const [gate] = await db
      .select({ id: gates.id })
      .from(gates)
      .innerJoin(domains, eq(gates.domainId, domains.id))
      .where(and(eq(gates.id, gateId), eq(domains.publisherId, domain.publisherId)))
      .limit(1)
    if (!gate) return null
  }

  return { ...reader, publisherId: domain.publisherId, brandId: domain.brandId ?? domain.publisherId }
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function handleCreate(req: NextRequest) {
  let body: { token?: string; gateId?: string; interval?: string; email?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  const { token, gateId, interval, email } = body
  if (!token || !gateId || !interval || !email) return NextResponse.json({ error: "missing fields" }, { status: 400 })
  if (!VALID_INTERVALS.has(interval)) return NextResponse.json({ error: "invalid interval" }, { status: 400 })
  if (!isEmail(email)) return NextResponse.json({ error: "invalid email" }, { status: 400 })

  const context = await resolveReaderPublisher(token, gateId)
  if (!context) return NextResponse.json({ error: "invalid token" }, { status: 401 })

  const [plan, pgConfig, pubRow] = await Promise.all([
    getPublisherReaderPlan(context.brandId),
    getOrCreatePgConfig(context.brandId, context.publisherId),
    db.select({ name: publishers.name }).from(publishers).where(eq(publishers.id, context.publisherId)).limit(1),
  ])
  const publisherName = pubRow[0]?.name ?? "OnePaywall"
  const selected = getEnabledSyncedIntervals(plan, pgConfig.mode as "platform" | "own").find(i => i.interval === interval)
  if (!selected) return NextResponse.json({ error: "subscription interval not available" }, { status: 400 })

  const gatewayCfg = await resolveConfig(context.publisherId, context.brandId)
  if (!gatewayCfg.keyId || !gatewayCfg.keySecret) {
    console.error("reader subscription: payment gateway not configured", {
      publisherId: context.publisherId, brandId: context.brandId, mode: gatewayCfg.mode,
    })
    return NextResponse.json({ error: "gateway_not_configured" }, { status: 503 })
  }

  try {
    const subscriber = await getOrCreateSubscriber(context.brandId, context.publisherId, email)

    if (await subscriberHasActiveSubscription(context.brandId, subscriber.id)) {
      return NextResponse.json({ error: "already_subscribed" }, { status: 409 })
    }

    const customerId = await createOrReuseReaderCustomer({
      publisherId: context.publisherId,
      brandId: context.brandId,
      email,
      existingCustomerId: subscriber.razorpayCustomerId,
    })
    if (!subscriber.razorpayCustomerId) await setSubscriberCustomerId(subscriber.id, customerId)

    const created = await createReaderSubscription({
      publisherId: context.publisherId,
      brandId: context.brandId,
      publisherName,
      subscriberId: subscriber.id,
      interval: interval as ReaderBillingInterval,
      razorpayPlanId: selected.razorpayPlanId,
      razorpayCustomerId: customerId,
    })
    await upsertReaderSubscription({
      publisherId: context.publisherId,
      brandId: context.brandId,
      subscriberId: subscriber.id,
      interval: interval as ReaderBillingInterval,
      pgMode: (selected.pgMode ?? "platform") as "platform" | "own",
      razorpaySubscriptionId: created.subscriptionId,
      razorpayPlanId: selected.razorpayPlanId,
      status: created.status,
    })
    await createPendingReaderTransaction({
      publisherId: context.publisherId,
      readerId: context.readerId,
      type: "subscription",
      amount: selected.price,
      currency: selected.currency,
      razorpaySubscriptionId: created.subscriptionId,
      readerEmail: email,
      metadata: { interval, gateId },
    })
    return NextResponse.json({
      subscriptionId: created.subscriptionId,
      keyId: created.keyId,
      interval,
      email,
      publisherName,
    })
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    console.error("reader subscription creation failed:", { detail, publisherId: context.publisherId, brandId: context.brandId })
    return NextResponse.json({ error: "payment provider error" }, { status: 502 })
  }
}

async function handleVerify(req: NextRequest) {
  let body: {
    token?: string
    gateId?: string
    razorpaySubscriptionId?: string
    razorpayPaymentId?: string
    razorpaySignature?: string
  }
  try { body = await req.json() } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  const { token, gateId, razorpaySubscriptionId, razorpayPaymentId, razorpaySignature } = body
  if (!token || !gateId || !razorpaySubscriptionId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 })
  }

  const context = await resolveReaderPublisher(token, gateId)
  if (!context) return NextResponse.json({ error: "invalid token" }, { status: 401 })

  const ours = await getReaderSubscriptionByRazorpayId(razorpaySubscriptionId)
  if (!ours || ours.publisherId !== context.publisherId) return NextResponse.json({ error: "subscription not found" }, { status: 404 })

  const valid = await verifyReaderSubscriptionSignature({
    publisherId: context.publisherId,
    razorpayPaymentId,
    razorpaySubscriptionId,
    razorpaySignature,
  })
  if (!valid) {
    await markReaderTransactionFailed({
      publisherId: context.publisherId,
      type: "subscription",
      razorpayPaymentId,
      razorpaySubscriptionId,
      readerId: context.readerId,
      failureReason: "Invalid Razorpay signature",
      metadata: { gateId },
    })
    return NextResponse.json({ error: "invalid signature" }, { status: 400 })
  }

  const [remote, payment] = await Promise.all([
    fetchReaderSubscription(context.publisherId, razorpaySubscriptionId),
    fetchReaderPayment(context.publisherId, razorpayPaymentId),
  ])
  if (!remote) return NextResponse.json({ error: "could not fetch subscription" }, { status: 502 })

  await upsertReaderSubscription({
    publisherId: context.publisherId,
    brandId: context.brandId,
    subscriberId: ours.subscriberId,
    interval: ours.interval as ReaderBillingInterval,
    pgMode: ours.pgMode as "platform" | "own",
    razorpaySubscriptionId,
    razorpayPlanId: remote.planId,
    status: remote.status === "authenticated" ? "active" : remote.status,
    currentPeriodStart: remote.currentStart,
    currentPeriodEnd: remote.currentEnd,
  })
  await linkReaderToSubscriber({ publisherId: context.publisherId, brandId: context.brandId, subscriberId: ours.subscriberId, readerId: context.readerId })

  if (payment) {
    await recordReaderSubscriptionPayment({
      publisherId: context.publisherId,
      brandId: context.brandId,
      readerId: context.readerId,
      domainId: context.domainId,
      razorpayPaymentId,
      razorpaySubscriptionId,
      amount: payment.amount,
      currency: payment.currency,
      interval: ours.interval,
      readerEmail: null,
    })
  }

  // Send confirmation email — fire-and-forget, never blocks the response
  Promise.all([
    getSubscriberById(ours.subscriberId),
    db.select({ name: publishers.name }).from(publishers).where(eq(publishers.id, context.publisherId)).limit(1),
  ]).then(([subscriber, pubRow]) => {
    if (!subscriber || !payment) return
    const email = getSubscriberEmail(subscriber)
    const publisherName = pubRow[0]?.name ?? "OnePaywall"
    return sendReaderSubscriptionConfirmation({
      to: email,
      publisherName,
      interval: ours.interval,
      amountPaise: payment.amount,
      currency: payment.currency,
      razorpayPaymentId,
      currentPeriodEnd: remote.currentEnd,
    })
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}

async function handleRestoreRequest(req: NextRequest) {
  let body: { token?: string; email?: string; returnUrl?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }
  const { token, email, returnUrl } = body
  if (!token || !email || !isEmail(email)) return NextResponse.json({ ok: true })

  const context = await resolveReaderPublisher(token)
  if (!context) return NextResponse.json({ ok: true })

  const subscriber = await getSubscriberByEmail(context.brandId, email)
  if (!subscriber || !(await subscriberHasActiveSubscription(context.brandId, subscriber.id))) {
    return NextResponse.json({ ok: true })
  }

  const [{ token: restoreToken }, pub] = await Promise.all([
    createSubscriptionMagicLink({ publisherId: context.publisherId, brandId: context.brandId, subscriberId: subscriber.id, returnUrl }),
    db.select({ name: publishers.name }).from(publishers).where(eq(publishers.id, context.publisherId)).limit(1),
  ])

  const target = new URL(returnUrl || "https://www.onepaywall.com")
  target.searchParams.set("opw_restore_token", restoreToken)
  sendReaderSubscriptionMagicLink(getSubscriberEmail(subscriber), pub[0]?.name ?? "this publication", target.toString()).catch(() => {})

  return NextResponse.json({ ok: true })
}

async function handleRestoreConfirm(req: NextRequest) {
  let body: { token?: string; restoreToken?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }
  if (!body.token || !body.restoreToken) return NextResponse.json({ error: "missing fields" }, { status: 400 })

  const context = await resolveReaderPublisher(body.token)
  if (!context) return NextResponse.json({ error: "invalid token" }, { status: 401 })

  const magic = await consumeSubscriptionMagicLink(body.restoreToken)
  if (!magic || magic.publisherId !== context.publisherId) return NextResponse.json({ error: "invalid restore token" }, { status: 400 })
  if (!(await subscriberHasActiveSubscription(context.brandId, magic.subscriberId))) {
    return NextResponse.json({ error: "subscription inactive" }, { status: 400 })
  }

  await linkReaderToSubscriber({ publisherId: context.publisherId, brandId: context.brandId, subscriberId: magic.subscriberId, readerId: context.readerId })
  return NextResponse.json({ ok: true, returnUrl: magic.returnUrl })
}
