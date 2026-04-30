import Razorpay from "razorpay"
import { createHmac } from "crypto"
import { resolveConfig } from "@/lib/payments/resolveConfig"
import type { ReaderBillingInterval } from "@/lib/db/queries/reader-subscriptions"

export type ReaderPaymentConfig = Awaited<ReturnType<typeof resolveConfig>>

export type ReaderPlanResult = {
  planId: string
  pgMode: "platform" | "own"
}

export type CreatedReaderSubscription = {
  subscriptionId: string
  keyId: string
  status: string
}

export type FetchedReaderSubscription = {
  id: string
  status: string
  planId: string
  currentStart: Date | null
  currentEnd: Date | null
  endedAt: Date | null
  notes: Record<string, unknown>
}

export type FetchedReaderPayment = {
  id: string
  amount: number
  currency: string
}

function getClient(cfg: ReaderPaymentConfig) {
  if (!cfg.keyId || !cfg.keySecret) {
    throw new Error("Reader payment gateway is not configured.")
  }
  return new Razorpay({ key_id: cfg.keyId, key_secret: cfg.keySecret })
}

function intervalToRazorpay(interval: ReaderBillingInterval) {
  switch (interval) {
    case "monthly":   return { period: "monthly", interval: 1, totalCount: 120 }
    case "quarterly": return { period: "monthly", interval: 3, totalCount: 40 }
    case "annual":    return { period: "yearly", interval: 1, totalCount: 10 }
  }
}

export async function createReaderRazorpayPlan(input: {
  publisherId: string
  publisherName: string
  interval: ReaderBillingInterval
  amount: number
  currency: string
}): Promise<ReaderPlanResult> {
  const cfg = await resolveConfig(input.publisherId)
  const client = getClient(cfg)
  const cadence = intervalToRazorpay(input.interval)
  const label = input.interval === "monthly" ? "Monthly" : input.interval === "quarterly" ? "Quarterly" : "Annual"
  const plans = client.plans as unknown as {
    create: (body: Record<string, unknown>) => Promise<{ id: string }>
  }

  const plan = await plans.create({
    period: cadence.period,
    interval: cadence.interval,
    item: {
      name: `${input.publisherName} ${label} Membership`,
      amount: input.amount,
      currency: input.currency,
      description: `${input.publisherName} reader membership`,
    },
    notes: {
      publisherId: input.publisherId,
      interval: input.interval,
      source: "onepaywall_reader_subscription",
    },
  })

  return { planId: plan.id, pgMode: cfg.mode }
}

export async function createOrReuseReaderCustomer(input: {
  publisherId: string
  brandId?: string | null
  email: string
  existingCustomerId?: string | null
}) {
  if (input.existingCustomerId) return input.existingCustomerId

  const cfg = await resolveConfig(input.publisherId, input.brandId)
  const client = getClient(cfg)
  const customers = client.customers as unknown as {
    create: (body: Record<string, unknown>) => Promise<{ id: string }>
  }

  const customer = await customers.create({
    email: input.email,
    notes: {
      publisherId: input.publisherId,
      source: "onepaywall_reader_subscription",
    },
  })

  return customer.id
}

export async function createReaderSubscription(input: {
  publisherId: string
  brandId?: string | null
  publisherName: string
  subscriberId: string
  interval: ReaderBillingInterval
  razorpayPlanId: string
  razorpayCustomerId: string
}): Promise<CreatedReaderSubscription> {
  const cfg = await resolveConfig(input.publisherId, input.brandId)
  const client = getClient(cfg)
  const cadence = intervalToRazorpay(input.interval)
  const subscriptions = client.subscriptions as unknown as {
    create: (body: Record<string, unknown>) => Promise<{ id: string; status: string }>
  }

  const sub = await subscriptions.create({
    plan_id: input.razorpayPlanId,
    customer_id: input.razorpayCustomerId,
    total_count: cadence.totalCount,
    customer_notify: 1,
    notes: {
      publisherId: input.publisherId,
      publisherName: input.publisherName,
      subscriberId: input.subscriberId,
      interval: input.interval,
      source: "onepaywall_reader_subscription",
    },
  })

  return {
    subscriptionId: sub.id,
    keyId: cfg.keyId,
    status: sub.status,
  }
}

export async function verifyReaderSubscriptionSignature(input: {
  publisherId: string
  razorpayPaymentId: string
  razorpaySubscriptionId: string
  razorpaySignature: string
}) {
  const cfg = await resolveConfig(input.publisherId)
  const expected = createHmac("sha256", cfg.keySecret)
    .update(`${input.razorpayPaymentId}|${input.razorpaySubscriptionId}`)
    .digest("hex")
  return expected === input.razorpaySignature
}

export async function fetchReaderSubscription(publisherId: string, subscriptionId: string): Promise<FetchedReaderSubscription | null> {
  const cfg = await resolveConfig(publisherId)
  const client = getClient(cfg)
  try {
    const sub = await client.subscriptions.fetch(subscriptionId)
    return {
      id: sub.id,
      status: String(sub.status),
      planId: String(sub.plan_id),
      currentStart: sub.current_start ? new Date(Number(sub.current_start) * 1000) : null,
      currentEnd: sub.current_end ? new Date(Number(sub.current_end) * 1000) : null,
      endedAt: sub.ended_at ? new Date(Number(sub.ended_at) * 1000) : null,
      notes: (sub.notes ?? {}) as Record<string, unknown>,
    }
  } catch {
    return null
  }
}

export async function fetchReaderPayment(publisherId: string, paymentId: string): Promise<FetchedReaderPayment | null> {
  const cfg = await resolveConfig(publisherId)
  const client = getClient(cfg)
  try {
    const payment = await client.payments.fetch(paymentId)
    return {
      id: payment.id,
      amount: Number(payment.amount),
      currency: String(payment.currency ?? "INR"),
    }
  } catch {
    return null
  }
}
