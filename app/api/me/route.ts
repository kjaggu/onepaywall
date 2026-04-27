import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getCurrentSubscription } from "@/lib/db/queries/billing"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const email = session.email
  const initials = email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s: string) => s[0].toUpperCase())
    .join("")
    .slice(0, 2)

  let subscription: {
    planSlug:           string
    status:             string
    currentPeriodEnd:   string | null
    daysUntilPeriodEnd: number | null
    cancelAtCycleEnd:   boolean
    isTrialing:         boolean
    isPastDue:          boolean
    isSuspended:        boolean
  } | null = null

  if (session.publisherId) {
    const sub = await getCurrentSubscription(session.publisherId)
    if (sub) {
      const days = sub.currentPeriodEnd
        ? Math.max(0, Math.ceil((sub.currentPeriodEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
        : null
      subscription = {
        planSlug:           sub.planSlug,
        status:             sub.status,
        currentPeriodEnd:   sub.currentPeriodEnd?.toISOString() ?? null,
        daysUntilPeriodEnd: days,
        cancelAtCycleEnd:   sub.cancelAtCycleEnd,
        isTrialing:         sub.status === "trialing",
        isPastDue:          sub.status === "past_due",
        isSuspended:        sub.status === "suspended",
      }
    }
  }

  // Backward-compat: existing topbar reads `plan` directly.
  return NextResponse.json({ email, initials, plan: subscription?.planSlug ?? null, subscription })
}
