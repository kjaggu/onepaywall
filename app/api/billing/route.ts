import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { getSession } from "@/lib/auth/session"
import {
  cancelPlatformSubscription,
  createPlatformSubscription,
  fetchPlatformInvoices,
  fetchPlatformSubscription,
  getPlatformKeyId,
  updatePlatformSubscriptionPlan,
} from "@/lib/payments/billing"
import {
  createTrialSubscription,
  findSubscriptionByRazorpayId,
  getCurrentSubscription,
  getPlan,
  listActivePlans,
  updateSubscription,
} from "@/lib/db/queries/billing"

// ─── GET /api/billing ───────────────────────────────────────────────────────
// Returns: current subscription state, the plan catalog, and (if active)
// recent invoices. Used by the /settings/billing page and the trial banner.
export async function GET() {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [sub, allPlans] = await Promise.all([
    getCurrentSubscription(session.publisherId),
    listActivePlans(),
  ])

  let invoices: Awaited<ReturnType<typeof fetchPlatformInvoices>> = []
  if (sub?.razorpaySubId) {
    invoices = await fetchPlatformInvoices(sub.razorpaySubId)
  }

  return NextResponse.json({
    subscription: sub,
    plans:        allPlans,
    invoices,
    daysUntilPeriodEnd: sub?.currentPeriodEnd
      ? Math.max(0, Math.ceil((sub.currentPeriodEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
      : null,
  })
}

// ─── POST /api/billing?action=… ─────────────────────────────────────────────
// Actions: subscribe, verify, change-plan, cancel, resume.
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const action = req.nextUrl.searchParams.get("action") ?? ""
  switch (action) {
    case "subscribe":   return handleSubscribe(req, session.publisherId)
    case "verify":      return handleVerify(req, session.publisherId)
    case "change-plan": return handleChangePlan(req, session.publisherId)
    case "cancel":      return handleCancel(session.publisherId)
    case "resume":      return handleResume(session.publisherId)
    default:            return NextResponse.json({ error: "unknown action" }, { status: 400 })
  }
}

// Create a Razorpay subscription and return the IDs the embedded checkout
// needs (subscription_id + key_id). The DB row is upserted with the
// Razorpay sub id; status flips to "active" only after verify.
async function handleSubscribe(req: NextRequest, publisherId: string) {
  let body: { planSlug?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  const plan = body.planSlug ? await getPlan(body.planSlug as never) : null
  if (!plan)                  return NextResponse.json({ error: "unknown plan" }, { status: 400 })
  if (!plan.razorpayPlanId)   return NextResponse.json({ error: "plan missing razorpay_plan_id — re-run db:seed:plans" }, { status: 500 })

  const existing = await getCurrentSubscription(publisherId)
  if (existing && existing.status === "active" && existing.razorpaySubId) {
    return NextResponse.json({ error: "already subscribed — use change-plan instead" }, { status: 400 })
  }

  let created
  try {
    created = await createPlatformSubscription({
      razorpayPlanId: plan.razorpayPlanId,
      publisherId,
      notify:         true,
    })
  } catch (e) {
    console.error("Razorpay sub creation failed:", e)
    return NextResponse.json({ error: "payment provider error" }, { status: 502 })
  }

  // Persist the razorpay sub id eagerly so the webhook can find this row by
  // razorpay_sub_id even before the user completes checkout.
  if (existing) {
    await updateSubscription(existing.id, {
      planSlug:      plan.slug,
      status:        "trialing", // remains trialing until verify flips to active
      razorpaySubId: created.id,
    })
  } else {
    // Edge case: signup didn't create a trial row. Make a fresh subscription
    // pointed at this plan with no trial.
    const now = new Date()
    await createTrialSubscription({ publisherId, planSlug: plan.slug, trialDays: 0 })
    const fresh = await getCurrentSubscription(publisherId)
    if (fresh) await updateSubscription(fresh.id, { razorpaySubId: created.id, currentPeriodStart: now })
  }

  return NextResponse.json({
    subscriptionId: created.id,
    keyId:          getPlatformKeyId(),
  })
}

// Verify is the synchronous "did the checkout succeed?" path. We trust
// Razorpay's signature, then re-fetch the subscription server-side for the
// authoritative status + period dates.
async function handleVerify(req: NextRequest, publisherId: string) {
  let body: { razorpaySubscriptionId?: string; razorpayPaymentId?: string; razorpaySignature?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  const { razorpaySubscriptionId, razorpayPaymentId, razorpaySignature } = body
  if (!razorpaySubscriptionId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 })
  }

  const keySecret = process.env.RAZORPAY_PLATFORM_KEY_SECRET
  if (!keySecret) return NextResponse.json({ error: "platform keys not configured" }, { status: 500 })

  const expected = createHmac("sha256", keySecret)
    .update(`${razorpayPaymentId}|${razorpaySubscriptionId}`)
    .digest("hex")
  if (expected !== razorpaySignature) return NextResponse.json({ error: "invalid signature" }, { status: 400 })

  const ours = await findSubscriptionByRazorpayId(razorpaySubscriptionId)
  if (!ours || ours.publisherId !== publisherId) {
    return NextResponse.json({ error: "subscription not found" }, { status: 404 })
  }

  const remote = await fetchPlatformSubscription(razorpaySubscriptionId)
  if (!remote) return NextResponse.json({ error: "could not fetch subscription" }, { status: 502 })

  await updateSubscription(ours.id, {
    status:             remote.status === "active" ? "active" : (ours.status),
    currentPeriodStart: remote.currentStart,
    currentPeriodEnd:   remote.currentEnd,
  })

  return NextResponse.json({ ok: true })
}

async function handleChangePlan(req: NextRequest, publisherId: string) {
  let body: { planSlug?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  const sub = await getCurrentSubscription(publisherId)
  if (!sub || !sub.razorpaySubId)  return NextResponse.json({ error: "no active subscription" }, { status: 400 })
  if (sub.status !== "active")     return NextResponse.json({ error: "subscription not active" }, { status: 400 })

  const newPlan = body.planSlug ? await getPlan(body.planSlug as never) : null
  if (!newPlan)                    return NextResponse.json({ error: "unknown plan" }, { status: 400 })
  if (!newPlan.razorpayPlanId)     return NextResponse.json({ error: "plan missing razorpay_plan_id" }, { status: 500 })

  const oldPlan = await getPlan(sub.planSlug)
  // Upgrades take effect now (prorated by Razorpay), downgrades at cycle end.
  const isUpgrade = (newPlan.priceMonthly ?? 0) > (oldPlan?.priceMonthly ?? 0)
  const scheduleChangeAt = isUpgrade ? "now" : "cycle_end"

  try {
    await updatePlatformSubscriptionPlan({
      subscriptionId:   sub.razorpaySubId,
      razorpayPlanId:   newPlan.razorpayPlanId,
      scheduleChangeAt,
    })
  } catch (e) {
    console.error("Razorpay plan change failed:", e)
    return NextResponse.json({ error: "payment provider error" }, { status: 502 })
  }

  // For upgrades the new plan applies immediately; for downgrades only at
  // cycle end. The webhook will reconcile the exact moment; we update DB
  // optimistically here for the immediate-upgrade case.
  if (isUpgrade) await updateSubscription(sub.id, { planSlug: newPlan.slug })

  return NextResponse.json({ ok: true, scheduleChangeAt })
}

async function handleCancel(publisherId: string) {
  const sub = await getCurrentSubscription(publisherId)
  if (!sub || !sub.razorpaySubId) return NextResponse.json({ error: "no active subscription" }, { status: 400 })
  if (sub.status === "cancelled") return NextResponse.json({ error: "already cancelled" }, { status: 400 })

  try {
    await cancelPlatformSubscription({ subscriptionId: sub.razorpaySubId, cancelAtCycleEnd: true })
  } catch (e) {
    console.error("Razorpay cancel failed:", e)
    return NextResponse.json({ error: "payment provider error" }, { status: 502 })
  }

  await updateSubscription(sub.id, { cancelAtCycleEnd: true })
  return NextResponse.json({ ok: true, effectiveAt: sub.currentPeriodEnd })
}

// Resume = clear cancelAtCycleEnd before period end. Razorpay doesn't have a
// direct "uncancel" — once cancelled, you create a new subscription. So this
// only works if the cancel hasn't actually fired yet (still cancelAtCycleEnd
// flagged but status = active).
async function handleResume(publisherId: string) {
  const sub = await getCurrentSubscription(publisherId)
  if (!sub)                       return NextResponse.json({ error: "no subscription" }, { status: 400 })
  if (!sub.cancelAtCycleEnd)      return NextResponse.json({ error: "not pending cancellation" }, { status: 400 })
  if (sub.status !== "active")    return NextResponse.json({ error: "cannot resume non-active subscription" }, { status: 400 })

  // Razorpay's cancel-at-cycle-end is a hold flag on their side; the only way
  // to undo is to create a new sub. For now we only update our flag and
  // surface a warning — the actual Razorpay-side reversal needs the publisher
  // to subscribe again at cycle end.
  await updateSubscription(sub.id, { cancelAtCycleEnd: false })
  return NextResponse.json({
    ok: true,
    note: "Pending cancellation cleared on our side. You may need to re-confirm with the payment provider at next renewal.",
  })
}
