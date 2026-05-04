import { notFound } from "next/navigation"
import { CreditCard } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import {
  listActivePlans,
  getCurrentSubscription,
  getPublisherLimits,
  getPublisherMonthlyGateTriggers,
  getPublisherPayingSubscriberCount,
  getPublisherMonthlyAdImpressions,
} from "@/lib/db/queries/billing"
import { fetchPlatformInvoices, getPlatformKeyId } from "@/lib/payments/billing"
import { BillingManager } from "@/components/dashboard/settings/billing-manager"

export default async function BillingPage() {
  const session = await getSession()
  if (!session?.publisherId) notFound()

  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [allPlans, subscription] = await Promise.all([
    listActivePlans(),
    getCurrentSubscription(session.publisherId),
  ])

  const periodStart = subscription?.currentPeriodStart ?? monthStart
  const periodEnd   = subscription?.currentPeriodEnd   ?? now

  const [invoices, limits, gateTriggers, subscriberCount, adImpressions] = await Promise.all([
    subscription?.razorpaySubId
      ? fetchPlatformInvoices(subscription.razorpaySubId)
      : Promise.resolve([]),
    getPublisherLimits(session.publisherId),
    getPublisherMonthlyGateTriggers(session.publisherId, monthStart, now),
    getPublisherPayingSubscriberCount(session.publisherId),
    getPublisherMonthlyAdImpressions(session.publisherId, periodStart, periodEnd),
  ])

  // Pass only serialisable values to the client component (no Date objects).
  const initialState = {
    plans: allPlans.map(p => ({
      slug:                   p.slug,
      name:                   p.name,
      priceMonthly:           p.priceMonthly,
      maxMonthlyGateTriggers: p.maxMonthlyGateTriggers ?? null,
      maxPayingSubscribers:   p.maxPayingSubscribers   ?? null,
      maxGates:               p.maxGates,
      trialDays:              p.trialDays,
      hasRazorpayPlanId:      !!p.razorpayPlanId,
    })),
    subscription: subscription ? {
      planSlug:         subscription.planSlug,
      status:           subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
      cancelAtCycleEnd: subscription.cancelAtCycleEnd,
      hasRazorpaySub:   !!subscription.razorpaySubId,
    } : null,
    invoices: invoices.map(i => ({
      id:       i.id,
      status:   i.status,
      amount:   i.amount,
      currency: i.currency,
      issuedAt: i.issuedAt?.toISOString() ?? null,
      paidAt:   i.paidAt?.toISOString() ?? null,
      shortUrl: i.shortUrl,
    })),
    keyId:     getPlatformKeyId(),
    userEmail: session.email,
    usage: {
      gateTriggers,
      gateTriggerLimit:       limits?.maxMonthlyGateTriggers ?? null,
      subscriberCount,
      subscriberLimit:        limits?.maxPayingSubscribers   ?? null,
      adImpressions,
      adFreeQuota:            limits?.maxFreeAdImpressions   ?? null,
      adOveragePricePerMille: limits?.adOveragePricePerMilleInr ?? null,
      currency:               "INR",
    },
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-lg bg-[var(--color-brand-subtle)] flex items-center justify-center shrink-0">
          <CreditCard size={18} className="text-[var(--color-brand)]" />
        </div>
        <div>
          <h1 className="text-h1 text-[var(--color-text)]">Plan &amp; billing</h1>
          <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
            Choose a plan, manage your subscription, and download invoices.
          </p>
        </div>
      </div>

      <BillingManager initialState={initialState} />
    </div>
  )
}
