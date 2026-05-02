import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db/client"
import { publisherEmailConfigs } from "@/lib/db/schema"
import { encrypt, decrypt } from "@/lib/payments/encrypt"

export async function GET() {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [config] = await db
    .select()
    .from(publisherEmailConfigs)
    .where(eq(publisherEmailConfigs.publisherId, session.publisherId))
    .limit(1)

  if (!config) return NextResponse.json({ config: null })

  return NextResponse.json({
    config: {
      id:               config.id,
      fromName:         config.fromName,
      fromEmail:        config.fromEmail,
      replyTo:          config.replyTo,
      domainVerifiedAt: config.domainVerifiedAt,
      hasApiKey:        true,
    },
  })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { resendApiKey, fromName, fromEmail, replyTo } = body

  if (!fromName || !fromEmail) {
    return NextResponse.json({ error: "fromName and fromEmail are required" }, { status: 400 })
  }

  const [existing] = await db
    .select({ id: publisherEmailConfigs.id, resendApiKey: publisherEmailConfigs.resendApiKey })
    .from(publisherEmailConfigs)
    .where(eq(publisherEmailConfigs.publisherId, session.publisherId))
    .limit(1)

  const encryptedKey = resendApiKey
    ? encrypt(resendApiKey)
    : existing?.resendApiKey ?? ""

  if (!encryptedKey) {
    return NextResponse.json({ error: "Resend API key is required" }, { status: 400 })
  }

  if (existing) {
    await db
      .update(publisherEmailConfigs)
      .set({ resendApiKey: encryptedKey, fromName, fromEmail, replyTo: replyTo ?? null, updatedAt: new Date() })
      .where(eq(publisherEmailConfigs.id, existing.id))
  } else {
    await db.insert(publisherEmailConfigs).values({
      publisherId: session.publisherId,
      resendApiKey: encryptedKey,
      fromName,
      fromEmail,
      replyTo: replyTo ?? null,
    })
  }

  return NextResponse.json({ ok: true })
}
