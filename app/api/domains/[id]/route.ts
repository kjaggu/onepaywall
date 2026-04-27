import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { updateDomain, deleteDomain, getDomain } from "@/lib/db/queries/domains"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const patch: Parameters<typeof updateDomain>[2] = {}
  if (body.name !== undefined) patch.name = String(body.name).trim()
  if (body.status !== undefined) patch.status = body.status
  if (body.embedEnabled !== undefined) patch.embedEnabled = Boolean(body.embedEnabled)
  if (Array.isArray(body.whitelistedPaths)) {
    patch.whitelistedPaths = body.whitelistedPaths.map(String).filter(Boolean)
  }

  const updated = await updateDomain(id, session.publisherId, patch)
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ domain: updated })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const existing = await getDomain(id, session.publisherId)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await deleteDomain(id, session.publisherId)
  return new NextResponse(null, { status: 204 })
}
