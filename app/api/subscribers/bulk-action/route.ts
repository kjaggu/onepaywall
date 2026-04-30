import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { bulkUpdateSubscriptionStatus } from "@/lib/db/queries/reader-subscriptions"

const ACTION_TO_STATUS = {
  cancel: "cancelled",
  pause: "paused",
  activate: "active",
} as const

type Action = keyof typeof ACTION_TO_STATUS

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { subscriptionIds, action } = body as { subscriptionIds: string[]; action: Action }

  if (!Array.isArray(subscriptionIds) || subscriptionIds.length === 0) {
    return NextResponse.json({ error: "subscriptionIds must be a non-empty array" }, { status: 400 })
  }
  if (!action || !(action in ACTION_TO_STATUS)) {
    return NextResponse.json({ error: "action must be one of: cancel, pause, activate" }, { status: 400 })
  }

  const status = ACTION_TO_STATUS[action]
  const rows = await bulkUpdateSubscriptionStatus(subscriptionIds, session.publisherId, status)

  return NextResponse.json({ updated: rows.length })
}
