import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { updateSubscriberNotes } from "@/lib/db/queries/reader-subscriptions"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  let body: { notes?: string | null }
  try { body = await req.json() } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  const subscriber = await updateSubscriberNotes(id, session.publisherId, body.notes ?? null)
  if (!subscriber) return NextResponse.json({ error: "not found" }, { status: 404 })

  return NextResponse.json({ subscriber })
}
