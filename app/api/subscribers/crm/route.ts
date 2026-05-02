import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listSubscribersCrm } from "@/lib/db/queries/reader-subscriptions"
import { getSubscriberTags } from "@/lib/db/queries/subscriber-tags"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const source = req.nextUrl.searchParams.get("source") ?? undefined

  const subscribers = await listSubscribersCrm(session.publisherId, { source })

  // Attach tags for each subscriber in parallel
  const withTags = await Promise.all(
    subscribers.map(async s => ({
      ...s,
      tags: await getSubscriberTags(s.id),
    }))
  )

  return NextResponse.json({ subscribers: withTags })
}
