import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getSubscriptionById, updateManualSubscriptionStatus } from "@/lib/db/queries/reader-subscriptions"

const ACTION_TO_STATUS = {
  cancel: "cancelled",
  pause: "paused",
  activate: "active",
} as const

type Action = keyof typeof ACTION_TO_STATUS

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: subscriptionId } = await params
  const body = await req.json()
  const { action } = body as { action: Action }

  if (!action || !(action in ACTION_TO_STATUS)) {
    return NextResponse.json({ error: "action must be one of: cancel, pause, activate" }, { status: 400 })
  }

  const existing = await getSubscriptionById(subscriptionId, session.publisherId)
  if (!existing) return NextResponse.json({ error: "Subscription not found" }, { status: 404 })

  const status = ACTION_TO_STATUS[action]
  const subscription = await updateManualSubscriptionStatus(subscriptionId, session.publisherId, status)

  return NextResponse.json({ subscription })
}
