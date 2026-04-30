import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listSubscribers, getSubscriberStats } from "@/lib/db/queries/reader-subscriptions"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get("status") ?? undefined

  const [subscribers, stats] = await Promise.all([
    listSubscribers(session.publisherId, { status }),
    getSubscriberStats(session.publisherId),
  ])

  return NextResponse.json({ subscribers, stats })
}
