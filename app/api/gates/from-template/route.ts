import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { GATE_TEMPLATES } from "@/lib/gates/templates"
import { createGate, createStep, createRule, countActiveGates } from "@/lib/db/queries/gates"
import { getPublisherLimits } from "@/lib/db/queries/billing"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ error: "No publisher found" }, { status: 403 })

  const { templateId, domainId, name } = await req.json()
  if (!templateId?.trim() || !domainId?.trim()) {
    return NextResponse.json({ error: "templateId and domainId are required" }, { status: 400 })
  }

  const template = GATE_TEMPLATES.find(t => t.id === templateId)
  if (!template) return NextResponse.json({ error: "Unknown template" }, { status: 400 })

  // Plan-limit check mirrors POST /api/gates
  const limits = await getPublisherLimits(session.publisherId)
  if (limits?.maxGates != null) {
    const current = await countActiveGates(session.publisherId)
    if (current >= limits.maxGates) {
      return NextResponse.json({
        error: `Your ${limits.planName} plan allows ${limits.maxGates} gate${limits.maxGates === 1 ? "" : "s"}. Upgrade to add more.`,
        upgrade: true,
      }, { status: 422 })
    }
  }

  const gate = await createGate({
    domainId,
    publisherId: session.publisherId,
    name: (name?.trim()) || template.name,
  })
  if (!gate) return NextResponse.json({ error: "Domain not found or access denied" }, { status: 404 })

  await createRule({
    gateId: gate.id,
    publisherId: session.publisherId,
    pattern: template.urlPattern,
    matchType: "path_glob",
  })

  for (const step of template.steps) {
    await createStep({
      gateId: gate.id,
      publisherId: session.publisherId,
      stepType: step.stepType,
      config: step.config,
      onSkip: step.onSkip,
      onDecline: step.onDecline,
    })
  }

  return NextResponse.json({ gate }, { status: 201 })
}
