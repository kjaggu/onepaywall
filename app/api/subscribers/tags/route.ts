import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getSubscriberById } from "@/lib/db/queries/reader-subscriptions"
import { addSubscriberTag, removeSubscriberTag } from "@/lib/db/queries/subscriber-tags"

// POST — add a tag to a subscriber
// DELETE — remove a tag from a subscriber
// Body: { subscriberId, tag }

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { subscriberId?: string; tag?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  const { subscriberId, tag } = body
  if (!subscriberId || !tag?.trim()) {
    return NextResponse.json({ error: "subscriberId and tag required" }, { status: 400 })
  }

  const subscriber = await getSubscriberById(subscriberId)
  if (!subscriber || subscriber.publisherId !== session.publisherId) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  await addSubscriberTag(subscriberId, session.publisherId, tag.trim())
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { subscriberId?: string; tag?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  const { subscriberId, tag } = body
  if (!subscriberId || !tag?.trim()) {
    return NextResponse.json({ error: "subscriberId and tag required" }, { status: 400 })
  }

  await removeSubscriberTag(subscriberId, session.publisherId, tag.trim())
  return NextResponse.json({ ok: true })
}
