import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { updatePublisherWebhook, deletePublisherWebhook } from "@/lib/db/queries/publisher-webhooks"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  let body: { url?: string; active?: boolean }
  try { body = await req.json() } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  if (body.url && !body.url.startsWith("https://")) {
    return NextResponse.json({ error: "url must be a valid https URL" }, { status: 400 })
  }

  const webhook = await updatePublisherWebhook(id, session.publisherId, body)
  if (!webhook) return NextResponse.json({ error: "not found" }, { status: 404 })

  return NextResponse.json({ webhook })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await deletePublisherWebhook(id, session.publisherId)
  return NextResponse.json({ ok: true })
}
