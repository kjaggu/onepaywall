import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { gateEvents, gates } from "@/lib/db/schema"
import { getReaderByToken } from "@/lib/embed/readerToken"

const VALID_EVENT_TYPES = new Set([
  "gate_shown", "step_shown", "gate_passed",
  "ad_start", "ad_complete", "ad_skip",
  "subscription_cta_click", "subscription_cta_skip",
  "one_time_unlock_start", "one_time_unlock_complete", "one_time_unlock_skip",
])

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.token || !body?.gateId || !body?.eventType) {
    return new NextResponse(null, { status: 204 })
  }

  if (!VALID_EVENT_TYPES.has(body.eventType)) {
    return new NextResponse(null, { status: 204 })
  }

  const reader = await getReaderByToken(body.token)
  if (!reader) return new NextResponse(null, { status: 204 })

  // Verify gate belongs to reader's domain
  const [gate] = await db
    .select({ id: gates.id, domainId: gates.domainId })
    .from(gates)
    .where(eq(gates.id, body.gateId))
    .limit(1)

  if (!gate || gate.domainId !== reader.domainId) {
    return new NextResponse(null, { status: 204 })
  }

  await db.insert(gateEvents).values({
    domainId: reader.domainId,
    gateId: gate.id,
    stepId: typeof body.stepId === "string" ? body.stepId : undefined,
    readerId: reader.readerId,
    eventType: body.eventType,
    contentId: typeof body.contentId === "string" ? body.contentId : undefined,
    metadata: typeof body.metadata === "object" ? body.metadata : {},
  })

  return new NextResponse(null, { status: 204 })
}
