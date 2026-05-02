import { NextRequest, NextResponse } from "next/server"
import { desc, eq } from "drizzle-orm"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db/client"
import { publisherEmailAutomations } from "@/lib/db/schema"

export async function GET() {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const automations = await db
    .select()
    .from(publisherEmailAutomations)
    .where(eq(publisherEmailAutomations.publisherId, session.publisherId))
    .orderBy(desc(publisherEmailAutomations.createdAt))

  return NextResponse.json({ automations })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, triggerType, triggerConfig, subject, bodyHtml, bodyText } = body

  const VALID_TRIGGERS = ["new_subscriber", "segment_entered", "ad_engaged", "inactivity"]
  if (!name || !triggerType || !subject || !bodyHtml) {
    return NextResponse.json({ error: "name, triggerType, subject, and bodyHtml are required" }, { status: 400 })
  }
  if (!VALID_TRIGGERS.includes(triggerType)) {
    return NextResponse.json({ error: "Invalid triggerType" }, { status: 400 })
  }

  const [automation] = await db
    .insert(publisherEmailAutomations)
    .values({
      publisherId:   session.publisherId,
      name,
      triggerType,
      triggerConfig: triggerConfig ?? {},
      subject,
      bodyHtml,
      bodyText:      bodyText ?? null,
      status:        "draft",
    })
    .returning()

  return NextResponse.json({ automation }, { status: 201 })
}
