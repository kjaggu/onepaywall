import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listRules, createRule } from "@/lib/db/queries/gates"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const rules = await listRules(id, session.publisherId)
  if (rules === null) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ rules })
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const { pattern, matchType } = await req.json()
  if (!pattern?.trim()) return NextResponse.json({ error: "Pattern is required" }, { status: 400 })

  const rule = await createRule({
    gateId: id,
    publisherId: session.publisherId,
    pattern: pattern.trim(),
    matchType: matchType === "content_type" ? "content_type" : "path_glob",
  })
  if (!rule) return NextResponse.json({ error: "Gate not found or access denied" }, { status: 404 })
  return NextResponse.json({ rule }, { status: 201 })
}
