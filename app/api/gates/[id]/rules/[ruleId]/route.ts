import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { deleteRule } from "@/lib/db/queries/gates"

type Params = { params: Promise<{ id: string; ruleId: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id, ruleId } = await params
  const ok = await deleteRule(ruleId, id, session.publisherId)
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return new NextResponse(null, { status: 204 })
}
