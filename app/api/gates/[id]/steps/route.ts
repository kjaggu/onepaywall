import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listSteps, createStep } from "@/lib/db/queries/gates"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const steps = await listSteps(id, session.publisherId)
  if (steps === null) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ steps })
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const { stepType, config, onSkip, onDecline } = await req.json()

  const validTypes = ["ad", "subscription_cta", "one_time_unlock"]
  if (!validTypes.includes(stepType)) {
    return NextResponse.json({ error: "Invalid stepType" }, { status: 400 })
  }

  const step = await createStep({
    gateId: id,
    publisherId: session.publisherId,
    stepType,
    config: config ?? {},
    onSkip: onSkip ?? "proceed",
    onDecline: onDecline ?? "proceed",
  })
  if (!step) return NextResponse.json({ error: "Gate not found or access denied" }, { status: 404 })
  return NextResponse.json({ step }, { status: 201 })
}
