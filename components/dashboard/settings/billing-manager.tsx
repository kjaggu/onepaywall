"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ExternalLink, RotateCcw, TrendingUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { fmtINR } from "@/lib/format"

type Plan = {
  slug:                   string
  name:                   string
  priceMonthly:           number | null
  maxMonthlyGateTriggers: number | null
  maxPayingSubscribers:   number | null
  maxGates:               number | null
  trialDays:              number | null
  hasRazorpayPlanId:      boolean
}

type Subscription = {
  planSlug:         string
  status:           string
  currentPeriodEnd: string | null
  cancelAtCycleEnd: boolean
  hasRazorpaySub:   boolean
}

type Invoice = {
  id:       string
  status:   string
  amount:   number
  currency: string
  issuedAt: string | null
  paidAt:   string | null
  shortUrl: string | null
}

type Usage = {
  gateTriggers:           number
  gateTriggerLimit:       number | null
  subscriberCount:        number
  subscriberLimit:        number | null
  adImpressions:          number
  adFreeQuota:            number | null
  adOveragePricePerMille: number | null  // paise per 1K
  currency:               string
}

type Props = {
  initialState: {
    plans:        Plan[]
    subscription: Subscription | null
    invoices:     Invoice[]
    keyId:        string | null
    userEmail:    string
    usage:        Usage
  }
}

declare global {
  interface Window { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void } }
}

const RZP_SDK = "https://checkout.razorpay.com/v1/checkout.js"

let _sdkPromise: Promise<void> | null = null
function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("server"))
  if (window.Razorpay) return Promise.resolve()
  if (_sdkPromise) return _sdkPromise
  _sdkPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script")
    s.src = RZP_SDK
    s.onload = () => resolve()
    s.onerror = () => reject(new Error("Could not load Razorpay checkout."))
    document.head.appendChild(s)
  })
  return _sdkPromise
}

function fmtDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function fmtCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString("en-IN")
}

function UsageMeter({
  label,
  value,
  limit,
  suffix = "",
}: {
  label:   string
  value:   number
  limit:   number
  suffix?: string
}) {
  const pct      = Math.min(100, (value / limit) * 100)
  const isHigh   = pct >= 80
  const isFull   = pct >= 100
  const barColor = isFull ? "#dc2626" : isHigh ? "#d97706" : "var(--color-brand)"

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-body-sm">
        <span className="text-[var(--color-text-secondary)]">{label}</span>
        <span className="font-medium text-[var(--color-text)]">
          {fmtCount(value)}{suffix} <span className="text-[var(--color-text-secondary)] font-normal">/ {fmtCount(limit)}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  )
}

export function BillingManager({ initialState }: Props) {
  const router = useRouter()
  const [busy, setBusy]   = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const { plans, subscription, invoices, keyId, userEmail, usage } = initialState

  const isTrialing  = subscription?.status === "trialing"
  const isActive    = subscription?.status === "active"
  const isCancelled = subscription?.status === "cancelled" || subscription?.cancelAtCycleEnd
  const isPastDue   = subscription?.status === "past_due"
  const isSuspended = subscription?.status === "suspended"
  const currentPlan = plans.find(p => p.slug === subscription?.planSlug)

  const daysRemaining = subscription?.currentPeriodEnd
    ? Math.max(0, Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / 86_400_000))
    : null

  // Estimate ad overage charge for current period
  const adOver    = usage.adFreeQuota != null ? Math.max(0, usage.adImpressions - usage.adFreeQuota) : 0
  const estAdFee  = usage.adOveragePricePerMille != null && adOver > 0
    ? Math.floor((adOver / 1000) * usage.adOveragePricePerMille)
    : 0

  // Whether any meter is in the warning zone (> 80%) to show upgrade CTA
  const anyMeterHigh =
    (usage.gateTriggerLimit  != null && usage.gateTriggers    / usage.gateTriggerLimit  >= 0.8) ||
    (usage.subscriberLimit   != null && usage.subscriberCount / usage.subscriberLimit   >= 0.8)

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleSubscribe = useCallback(async (slug: string) => {
    setBusy(slug); setError(null)
    try {
      const res = await fetch("/api/billing?action=subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: slug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Could not start subscription.")
      if (!keyId) throw new Error("Razorpay public key not configured.")

      await loadRazorpay()
      const Rzp = window.Razorpay!
      const rzp = new Rzp({
        key:             keyId,
        subscription_id: data.subscriptionId,
        name:            "OnePaywall",
        description:     `${plans.find(p => p.slug === slug)?.name ?? slug} subscription`,
        prefill:         { email: userEmail },
        theme:           { color: "#27adb0" },
        handler: async (response: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch("/api/billing?action=verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpaySubscriptionId: response.razorpay_subscription_id,
                razorpayPaymentId:      response.razorpay_payment_id,
                razorpaySignature:      response.razorpay_signature,
              }),
            })
            if (!verifyRes.ok) {
              const v = await verifyRes.json().catch(() => ({}))
              throw new Error(v.error ?? "Could not verify payment.")
            }
            router.refresh()
          } catch (e) {
            setError(e instanceof Error ? e.message : "Verification failed.")
          } finally {
            setBusy(null)
          }
        },
        modal: { ondismiss: () => setBusy(null) },
      })
      rzp.open()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.")
      setBusy(null)
    }
  }, [keyId, userEmail, plans, router])

  const handleChangePlan = useCallback(async (slug: string) => {
    setBusy(slug); setError(null)
    try {
      const res = await fetch("/api/billing?action=change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: slug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Could not change plan.")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not change plan.")
    } finally {
      setBusy(null)
    }
  }, [router])

  const handleCancel = useCallback(async () => {
    setBusy("cancel"); setError(null)
    try {
      const res = await fetch("/api/billing?action=cancel", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Could not cancel.")
      setConfirmCancel(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel.")
    } finally {
      setBusy(null)
    }
  }, [router])

  const handleResume = useCallback(async () => {
    setBusy("resume"); setError(null)
    try {
      const res = await fetch("/api/billing?action=resume", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Could not resume.")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resume.")
    } finally {
      setBusy(null)
    }
  }, [router])

  // ─── Render helpers ───────────────────────────────────────────────────────

  function statusCardCopy() {
    if (isSuspended) return {
      heading: "Your subscription is suspended",
      detail:  "Service has stopped because payment couldn't be collected for over 7 days. Subscribe to a plan below to restore access.",
      tone:    "danger" as const,
    }
    if (isPastDue) return {
      heading: "We couldn't collect your last payment",
      detail:  daysRemaining != null
        ? `Service continues for ${daysRemaining} more day${daysRemaining === 1 ? "" : "s"}. Update your card or we'll suspend automatically.`
        : "Update your card to continue.",
      tone:    "warning" as const,
    }
    if (isCancelled && subscription?.currentPeriodEnd) return {
      heading: "Cancellation pending",
      detail:  `Your ${currentPlan?.name ?? subscription.planSlug} plan stays active until ${fmtDate(subscription.currentPeriodEnd)}.`,
      tone:    "warning" as const,
    }
    if (isTrialing) return {
      heading: daysRemaining === 0
        ? "Your trial ends today"
        : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} of free Starter trial remaining`,
      detail:  "Pick a plan below to keep your gates serving after the trial ends.",
      tone:    "info" as const,
    }
    if (isActive && currentPlan) return {
      heading: `${currentPlan.name} · ${currentPlan.priceMonthly ? fmtINR(currentPlan.priceMonthly) : "—"} / month`,
      detail:  subscription?.currentPeriodEnd ? `Renews on ${fmtDate(subscription.currentPeriodEnd)}.` : "Active subscription.",
      tone:    "ok" as const,
    }
    return {
      heading: "No active plan",
      detail:  "Pick a plan below to start your subscription.",
      tone:    "info" as const,
    }
  }

  function planButton(p: Plan) {
    const isCurrent = subscription?.planSlug === p.slug && (isActive || isTrialing)
    const disabled  = busy !== null || !p.hasRazorpayPlanId

    if (isCurrent && isActive) {
      return <Button variant="secondary" disabled className="w-full">Current plan</Button>
    }
    if (isCurrent && isTrialing) {
      return (
        <Button onClick={() => handleSubscribe(p.slug)} disabled={disabled} className="w-full">
          {busy === p.slug ? "Opening checkout…" : "Subscribe"}
        </Button>
      )
    }
    if (isActive) {
      const currentPrice = currentPlan?.priceMonthly ?? 0
      const isUpgrade = (p.priceMonthly ?? 0) > currentPrice
      return (
        <Button
          variant="outline"
          onClick={() => handleChangePlan(p.slug)}
          disabled={disabled}
          className="w-full"
        >
          {busy === p.slug ? "Switching…" : isUpgrade ? `Upgrade to ${p.name}` : "Switch at cycle end"}
        </Button>
      )
    }
    return (
      <Button onClick={() => handleSubscribe(p.slug)} disabled={disabled} className="w-full">
        {busy === p.slug ? "Opening checkout…" : "Subscribe"}
      </Button>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const status = statusCardCopy()
  const toneStyles = {
    info:    { bg: "var(--color-surface)",       border: "var(--color-border)",          fg: "var(--color-text)"     },
    ok:      { bg: "var(--color-brand-subtle)",  border: "var(--color-brand-subtle)",    fg: "var(--color-text)"     },
    warning: { bg: "#fff8ed",                    border: "#f5d28a",                      fg: "#7a4500"               },
    danger:  { bg: "#fdecea",                    border: "#f5b5b0",                      fg: "#922118"               },
  }[status.tone]

  const hasActiveSubscription = isActive || isTrialing || isPastDue

  return (
    <div className="flex flex-col gap-6">
      {/* Status card */}
      <div
        className="rounded-xl border p-5 flex items-start justify-between gap-4"
        style={{ background: toneStyles.bg, borderColor: toneStyles.border, color: toneStyles.fg }}
      >
        <div>
          <p className="text-body font-semibold mb-0.5">{status.heading}</p>
          <p className="text-body-sm opacity-80">{status.detail}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isActive && !subscription?.cancelAtCycleEnd && (
            confirmCancel ? (
              <>
                <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(false)} disabled={busy === "cancel"}>
                  Keep
                </Button>
                <Button size="sm" variant="destructive" onClick={handleCancel} disabled={busy === "cancel"}>
                  {busy === "cancel" ? "Cancelling…" : "Confirm cancel"}
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(true)}>
                <X size={13} />
                Cancel plan
              </Button>
            )
          )}
          {subscription?.cancelAtCycleEnd && (
            <Button size="sm" variant="outline" onClick={handleResume} disabled={busy === "resume"}>
              <RotateCcw size={13} />
              {busy === "resume" ? "Resuming…" : "Resume"}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-[#f5b5b0] bg-[#fdecea] px-4 py-3 text-body-sm text-[#922118]">
          {error}
        </div>
      )}

      {/* Usage meters — only shown when on an active plan with limits */}
      {hasActiveSubscription && (
        <div className="rounded-xl border border-[var(--color-border)] p-5 flex flex-col gap-4">
          <h2 className="text-body font-semibold text-[var(--color-text)]">Usage this billing period</h2>

          <div className="flex flex-col gap-3">
            {usage.gateTriggerLimit != null ? (
              <UsageMeter
                label="Gate triggers"
                value={usage.gateTriggers}
                limit={usage.gateTriggerLimit}
                suffix=" triggers"
              />
            ) : (
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-[var(--color-text-secondary)]">Gate triggers</span>
                <span className="font-medium text-[var(--color-text)]">{fmtCount(usage.gateTriggers)} <span className="text-[var(--color-text-secondary)] font-normal">/ unlimited</span></span>
              </div>
            )}

            {usage.subscriberLimit != null ? (
              <UsageMeter
                label="Paying subscribers"
                value={usage.subscriberCount}
                limit={usage.subscriberLimit}
                suffix=" seats"
              />
            ) : (
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-[var(--color-text-secondary)]">Paying subscribers</span>
                <span className="font-medium text-[var(--color-text)]">{fmtCount(usage.subscriberCount)} <span className="text-[var(--color-text-secondary)] font-normal">/ unlimited</span></span>
              </div>
            )}

            <div className="flex items-center justify-between text-body-sm">
              <span className="text-[var(--color-text-secondary)]">Ad impressions</span>
              <span className="font-medium text-[var(--color-text)]">
                {fmtCount(usage.adImpressions)}
                {usage.adFreeQuota != null && (
                  <span className="text-[var(--color-text-secondary)] font-normal"> / {fmtCount(usage.adFreeQuota)} free</span>
                )}
              </span>
            </div>

            {estAdFee > 0 && (
              <div className="flex items-center justify-between text-body-sm pt-1 border-t border-[var(--color-border)]">
                <span className="text-[var(--color-text-secondary)]">Est. ad overage charge</span>
                <span className="font-medium text-[#d97706]">{fmtINR(estAdFee)}</span>
              </div>
            )}
          </div>

          {anyMeterHigh && (
            <div className="flex items-center justify-between rounded-lg bg-[#fff8ed] border border-[#f5d28a] px-3 py-2.5 mt-1">
              <div className="flex items-center gap-2 text-body-sm text-[#7a4500]">
                <TrendingUp size={14} />
                You&apos;re approaching your plan limits
              </div>
              <Button size="sm" variant="outline" className="shrink-0" onClick={() => {
                document.getElementById("plans-section")?.scrollIntoView({ behavior: "smooth" })
              }}>
                Upgrade plan
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Plan picker */}
      <div id="plans-section">
        <h2 className="text-body font-semibold text-[var(--color-text)] mb-3">Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {plans.map(p => {
            const isCurrent = subscription?.planSlug === p.slug && (isActive || isTrialing)
            return (
              <div
                key={p.slug}
                className="motion-lift border rounded-xl p-5 flex flex-col gap-3"
                style={{
                  background:   isCurrent ? "var(--color-brand-subtle)" : "var(--color-card, #fff)",
                  borderColor:  isCurrent ? "var(--color-brand)" : "var(--color-border)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-body font-semibold text-[var(--color-text)]">{p.name}</span>
                  {isCurrent && <Badge>Current</Badge>}
                </div>
                <div>
                  <span className="text-h2 text-[var(--color-text)] font-semibold">
                    {p.priceMonthly ? fmtINR(p.priceMonthly) : "—"}
                  </span>
                  <span className="text-body-sm text-[var(--color-text-secondary)]"> / mo</span>
                </div>
                <ul className="flex flex-col gap-1 text-body-sm text-[var(--color-text-secondary)] flex-1">
                  <li className="flex items-center gap-1.5">
                    <Check size={12} className="text-[var(--color-brand)] shrink-0" />
                    {p.maxMonthlyGateTriggers == null
                      ? "Unlimited gate triggers"
                      : `${fmtCount(p.maxMonthlyGateTriggers)} triggers / mo`}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check size={12} className="text-[var(--color-brand)] shrink-0" />
                    {p.maxPayingSubscribers == null
                      ? "Unlimited subscriber seats"
                      : `${fmtCount(p.maxPayingSubscribers)} subscriber seats`}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check size={12} className="text-[var(--color-brand)] shrink-0" />
                    {p.maxGates == null ? "Unlimited gates" : `${p.maxGates} gates`}
                  </li>
                  {(p.trialDays ?? 0) > 0 && (
                    <li className="flex items-center gap-1.5">
                      <Check size={12} className="text-[var(--color-brand)] shrink-0" />
                      {p.trialDays}-day free trial
                    </li>
                  )}
                </ul>
                {planButton(p)}
                {!p.hasRazorpayPlanId && (
                  <p className="text-label text-[var(--color-text-secondary)]">Plan setup pending</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <div>
          <h2 className="text-body font-semibold text-[var(--color-text)] mb-3">Invoices</h2>
          <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_120px_120px_60px] gap-4 px-4 py-2.5 bg-[var(--muted)] border-b border-[var(--color-border)]">
              <span className="text-label text-[var(--color-text-secondary)]">Date</span>
              <span className="text-label text-[var(--color-text-secondary)]">Amount</span>
              <span className="text-label text-[var(--color-text-secondary)]">Status</span>
              <span />
            </div>
            {invoices.map((inv, i) => (
              <div
                key={inv.id}
                className={`grid grid-cols-[1fr_120px_120px_60px] gap-4 px-4 py-3 items-center ${i < invoices.length - 1 ? "border-b border-[var(--color-border)]" : ""}`}
              >
                <span className="text-body-sm text-[var(--color-text)]">{fmtDate(inv.paidAt ?? inv.issuedAt)}</span>
                <span className="text-body-sm font-medium text-[var(--color-text)]">{fmtINR(inv.amount)}</span>
                <span className="text-body-sm capitalize text-[var(--color-text-secondary)]">{inv.status}</span>
                {inv.shortUrl ? (
                  <a
                    href={inv.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body-sm text-[var(--color-brand)] flex items-center gap-1 justify-end"
                  >
                    View
                    <ExternalLink size={11} />
                  </a>
                ) : <span />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
