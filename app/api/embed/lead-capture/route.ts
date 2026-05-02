import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { domains, gateSteps } from "@/lib/db/schema"
import { getReaderByToken } from "@/lib/embed/readerToken"
import { captureLeadEmail } from "@/lib/leads/captureLeadEmail"
import { fireLeadWebhooks } from "@/lib/leads/fireWebhooks"
import { decrypt } from "@/lib/payments/encrypt"
import { getSubscriberEmail } from "@/lib/db/queries/reader-subscriptions"
import { evaluateAutomations } from "@/lib/email/automations/engine"

// POST /api/embed/lead-capture
// Body: { token, gateId, stepId, email, name?, gdprConsent }
export async function POST(req: NextRequest) {
  let body: {
    token?: string
    gateId?: string
    stepId?: string
    email?: string
    name?: string
    gdprConsent?: boolean
  }
  try { body = await req.json() } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  const { token, gateId, stepId, email, name, gdprConsent } = body
  if (!token || !gateId || !stepId || !email || gdprConsent === undefined) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 })
  }

  const emailTrimmed = email.trim()
  if (!emailTrimmed.includes("@")) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 })
  }

  const reader = await getReaderByToken(token)
  if (!reader) return NextResponse.json({ error: "invalid token" }, { status: 401 })

  const [domainRow] = await db
    .select({ publisherId: domains.publisherId })
    .from(domains)
    .where(eq(domains.id, reader.domainId))
    .limit(1)
  if (!domainRow) return NextResponse.json({ error: "domain not found" }, { status: 404 })

  const [step] = await db
    .select({ config: gateSteps.config })
    .from(gateSteps)
    .where(eq(gateSteps.id, stepId))
    .limit(1)
  if (!step) return NextResponse.json({ error: "step not found" }, { status: 404 })

  const stepCfg = step.config as { brandId?: string }

  const { subscriberId } = await captureLeadEmail({
    publisherId: domainRow.publisherId,
    brandId: stepCfg.brandId ?? null,
    readerId: reader.readerId,
    gateId,
    email: emailTrimmed,
    name: name?.trim() || null,
    gdprConsent: !!gdprConsent,
  })

  // Fire webhooks fire-and-forget — don't await
  fireLeadWebhooks(domainRow.publisherId, {
    email: emailTrimmed,
    name: name?.trim() || null,
    publisherId: domainRow.publisherId,
    capturedAt: new Date().toISOString(),
  }).catch(() => {/* silently ignore */})

  // Trigger new_subscriber automations fire-and-forget
  void evaluateAutomations({
    type:         "new_subscriber",
    publisherId:  domainRow.publisherId,
    subscriberId,
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
