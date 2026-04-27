import Razorpay from "razorpay"

// OnePaywall billing client — talks to OnePaywall's own Razorpay account
// (NOT the publisher's). Distinct from lib/payments/oneTimeUnlock.ts which
// uses each publisher's own keys to charge their readers.

let _client: Razorpay | null = null

function getClient(): Razorpay {
  if (_client) return _client
  const keyId     = process.env.RAZORPAY_PLATFORM_KEY_ID
  const keySecret = process.env.RAZORPAY_PLATFORM_KEY_SECRET
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_PLATFORM_KEY_ID and RAZORPAY_PLATFORM_KEY_SECRET must be set in env.")
  }
  _client = new Razorpay({ key_id: keyId, key_secret: keySecret })
  return _client
}

export function getPlatformKeyId(): string | null {
  return process.env.RAZORPAY_PLATFORM_KEY_ID ?? null
}

export type CreatedSubscription = {
  id:           string
  status:       string
  shortUrl?:    string
  currentEnd?:  number
}

// Razorpay sub creation. total_count is required by Razorpay — we set a high
// value (10 years of months) so the subscription effectively renews "forever"
// until the publisher cancels. Razorpay does not currently support truly
// open-ended subscriptions; this is the standard SaaS workaround.
export async function createPlatformSubscription(input: {
  razorpayPlanId: string
  publisherId:    string
  notify:         boolean
  notes?:         Record<string, string>
}): Promise<CreatedSubscription> {
  const client = getClient()
  const sub = await client.subscriptions.create({
    plan_id:         input.razorpayPlanId,
    total_count:     120, // 10 years of monthly cycles
    customer_notify: input.notify ? 1 : 0,
    notes:           { publisherId: input.publisherId, ...(input.notes ?? {}) },
  })
  return {
    id:         sub.id,
    status:     sub.status,
    shortUrl:   sub.short_url,
    currentEnd: sub.current_end ? Number(sub.current_end) : undefined,
  }
}

export type FetchedSubscription = {
  id:                 string
  status:             string
  planId:             string
  currentStart:       Date | null
  currentEnd:         Date | null
  endedAt:            Date | null
  cancelledAt:        Date | null
  remainingCount:     number | null
  notes:              Record<string, unknown>
}

export async function fetchPlatformSubscription(subscriptionId: string): Promise<FetchedSubscription | null> {
  try {
    const sub = await getClient().subscriptions.fetch(subscriptionId)
    return {
      id:             sub.id,
      status:         sub.status,
      planId:         sub.plan_id,
      currentStart:   sub.current_start ? new Date(Number(sub.current_start) * 1000) : null,
      currentEnd:     sub.current_end   ? new Date(Number(sub.current_end)   * 1000) : null,
      endedAt:        sub.ended_at      ? new Date(Number(sub.ended_at)      * 1000) : null,
      cancelledAt:    null, // Razorpay returns this in webhook payloads, not on fetch
      remainingCount: typeof sub.remaining_count === "number" ? sub.remaining_count : null,
      notes:          (sub.notes ?? {}) as Record<string, unknown>,
    }
  } catch {
    return null
  }
}

// Razorpay subscription update — for upgrades (immediate + prorated) and
// downgrades (apply at cycle end). schedule_change_at: 'now' bills the
// difference immediately; 'cycle_end' queues the change.
export async function updatePlatformSubscriptionPlan(input: {
  subscriptionId:   string
  razorpayPlanId:   string
  scheduleChangeAt: "now" | "cycle_end"
}): Promise<void> {
  const client = getClient()
  // The razorpay node SDK exposes update via a generic call — typings are
  // loose so we cast through unknown.
  type UpdateBody = { plan_id: string; schedule_change_at: "now" | "cycle_end"; customer_notify?: 0 | 1 }
  const subs = client.subscriptions as unknown as { update: (id: string, body: UpdateBody) => Promise<unknown> }
  await subs.update(input.subscriptionId, {
    plan_id:            input.razorpayPlanId,
    schedule_change_at: input.scheduleChangeAt,
    customer_notify:    1,
  })
}

// Soft cancel — keeps service active until current_period_end.
export async function cancelPlatformSubscription(input: {
  subscriptionId:    string
  cancelAtCycleEnd:  boolean
}): Promise<void> {
  await getClient().subscriptions.cancel(input.subscriptionId, input.cancelAtCycleEnd)
}

// Razorpay invoices for a subscription — paid / pending / issued. Each row
// includes a hosted, GST-compliant short_url we link out to.
export type Invoice = {
  id:        string
  status:    string
  amount:    number
  currency:  string
  issuedAt:  Date | null
  paidAt:    Date | null
  shortUrl:  string | null
}

export async function fetchPlatformInvoices(subscriptionId: string): Promise<Invoice[]> {
  try {
    const res = await getClient().invoices.all({ subscription_id: subscriptionId, count: 12 })
    const items = (res.items ?? []) as unknown as Array<{
      id: string
      status: string
      amount: number
      currency: string
      issued_at?: number
      paid_at?: number
      short_url?: string
    }>
    return items.map(i => ({
      id:       i.id,
      status:   i.status,
      amount:   i.amount,
      currency: i.currency,
      issuedAt: i.issued_at ? new Date(Number(i.issued_at) * 1000) : null,
      paidAt:   i.paid_at   ? new Date(Number(i.paid_at)   * 1000) : null,
      shortUrl: i.short_url ?? null,
    }))
  } catch {
    return []
  }
}
