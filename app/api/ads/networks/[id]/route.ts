import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { updateAdNetworkActive, deleteAdNetwork } from "@/lib/db/queries/ad-networks"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (typeof body?.active !== "boolean") {
    return NextResponse.json({ error: "active (boolean) is required" }, { status: 400 })
  }

  await updateAdNetworkActive(id, session.publisherId, body.active)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const { id } = await params
  await deleteAdNetwork(id, session.publisherId)
  return NextResponse.json({ ok: true })
}
