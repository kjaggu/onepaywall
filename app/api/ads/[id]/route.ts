import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { updateAdUnit, deleteAdUnit } from "@/lib/db/queries/ads"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const unit = await updateAdUnit(id, session.publisherId, body)
  return NextResponse.json({ unit })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await deleteAdUnit(id, session.publisherId)
  return NextResponse.json({ ok: true })
}
