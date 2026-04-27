import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getGate, updateGate, deleteGate } from "@/lib/db/queries/gates"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const row = await getGate(id, session.publisherId)
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ gate: row.gate, domain: row.domain })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const patch: Parameters<typeof updateGate>[2] = {}
  if (body.name !== undefined) patch.name = String(body.name).trim()
  if (body.priority !== undefined) patch.priority = Number(body.priority)
  if (body.enabled !== undefined) patch.enabled = Boolean(body.enabled)
  if (body.triggerConditions !== undefined) patch.triggerConditions = body.triggerConditions

  const updated = await updateGate(id, session.publisherId, patch)
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ gate: updated })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const ok = await deleteGate(id, session.publisherId)
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return new NextResponse(null, { status: 204 })
}
