import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { updateStep, deleteStep } from "@/lib/db/queries/gates"

type Params = { params: Promise<{ id: string; stepId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id, stepId } = await params
  const body = await req.json()
  const patch: Parameters<typeof updateStep>[3] = {}
  if (body.config !== undefined) patch.config = body.config
  if (body.onSkip !== undefined) patch.onSkip = body.onSkip
  if (body.onDecline !== undefined) patch.onDecline = body.onDecline
  if (body.stepOrder !== undefined) patch.stepOrder = Number(body.stepOrder)

  const updated = await updateStep(stepId, id, session.publisherId, patch)
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ step: updated })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id, stepId } = await params
  const ok = await deleteStep(stepId, id, session.publisherId)
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return new NextResponse(null, { status: 204 })
}
