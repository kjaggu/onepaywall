"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowRight, Clock } from "lucide-react"

type Subscription = {
  planSlug:           string
  status:             string
  currentPeriodEnd:   string | null
  daysUntilPeriodEnd: number | null
  cancelAtCycleEnd:   boolean
  isTrialing:         boolean
  isPastDue:          boolean
  isSuspended:        boolean
}

// Persistent banner shown when the publisher needs to act on billing —
// trialing, past_due, or suspended. Hidden in steady-state (active sub,
// no cancel pending). Mounted in the dashboard layout so every page has it.
export function BillingBanner() {
  const [sub, setSub] = useState<Subscription | null>(null)

  useEffect(() => {
    fetch("/api/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.subscription) setSub(d.subscription) })
      .catch(() => {})
  }, [])

  if (!sub) return null

  const tone = sub.isSuspended ? "danger"
    : sub.isPastDue           ? "danger"
    : sub.isTrialing          ? "info"
    : sub.cancelAtCycleEnd    ? "warning"
    : null
  if (!tone) return null

  const message = sub.isSuspended
    ? "Subscription suspended — gates have stopped serving. Pick a plan to restore service."
    : sub.isPastDue
      ? `Payment failed. Service continues for ${sub.daysUntilPeriodEnd ?? 0} more day${sub.daysUntilPeriodEnd === 1 ? "" : "s"} — update your card before then.`
      : sub.cancelAtCycleEnd
        ? `Cancellation pending — service ends in ${sub.daysUntilPeriodEnd ?? 0} day${sub.daysUntilPeriodEnd === 1 ? "" : "s"}.`
        : sub.daysUntilPeriodEnd === 0
          ? "Your trial ends today — pick a plan to keep going."
          : `${sub.daysUntilPeriodEnd} day${sub.daysUntilPeriodEnd === 1 ? "" : "s"} of free Starter trial remaining.`

  const cta = sub.isSuspended || sub.isPastDue ? "Fix billing" : sub.isTrialing ? "Pick a plan" : "Manage"
  const styles = {
    info:    { bg: "var(--color-brand-subtle)", border: "var(--color-brand-subtle)", fg: "var(--color-text)" },
    warning: { bg: "#fff8ed", border: "#f5d28a", fg: "#7a4500" },
    danger:  { bg: "#fdecea", border: "#f5b5b0", fg: "#922118" },
  }[tone]

  const Icon = tone === "info" ? Clock : AlertTriangle

  return (
    <div
      className="border-b px-6 py-2.5 flex items-center justify-between gap-4 shrink-0"
      style={{ background: styles.bg, borderColor: styles.border, color: styles.fg }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon size={14} className="shrink-0" />
        <span className="text-body-sm truncate">{message}</span>
      </div>
      <Link
        href="/settings/billing"
        className="text-body-sm font-medium flex items-center gap-1 hover:underline shrink-0"
      >
        {cta}
        <ArrowRight size={13} />
      </Link>
    </div>
  )
}
