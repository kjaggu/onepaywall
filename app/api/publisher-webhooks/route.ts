import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listPublisherWebhooks, createPublisherWebhook } from "@/lib/db/queries/publisher-webhooks"

const ALLOWED_EVENTS = ["lead_captured"] as const

export async function GET() {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const webhooks = await listPublisherWebhooks(session.publisherId)
  return NextResponse.json({ webhooks })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { event?: string; url?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  const { event, url } = body
  if (!event || !ALLOWED_EVENTS.includes(event as typeof ALLOWED_EVENTS[number])) {
    return NextResponse.json({ error: `event must be one of: ${ALLOWED_EVENTS.join(", ")}` }, { status: 400 })
  }
  if (!url || !url.startsWith("https://")) {
    return NextResponse.json({ error: "url must be a valid https URL" }, { status: 400 })
  }

  const webhook = await createPublisherWebhook({ publisherId: session.publisherId, event, url })
  return NextResponse.json({ webhook }, { status: 201 })
}
