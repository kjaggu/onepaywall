import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listGatesForPublisher, createGate } from "@/lib/db/queries/gates"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ gates: [] })

  const rows = await listGatesForPublisher(session.publisherId)
  return NextResponse.json({ gates: rows })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ error: "No publisher found" }, { status: 403 })

  const { domainId, name, priority, triggerConditions } = await req.json()
  if (!domainId?.trim()) return NextResponse.json({ error: "domainId is required" }, { status: 400 })
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  const gate = await createGate({
    domainId,
    publisherId: session.publisherId,
    name: name.trim(),
    priority: typeof priority === "number" ? priority : 0,
    triggerConditions: triggerConditions ?? {},
  })
  if (!gate) return NextResponse.json({ error: "Domain not found or access denied" }, { status: 404 })

  return NextResponse.json({ gate }, { status: 201 })
}
