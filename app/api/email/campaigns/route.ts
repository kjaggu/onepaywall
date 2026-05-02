import { NextRequest, NextResponse } from "next/server"
import { desc, eq } from "drizzle-orm"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db/client"
import { publisherEmailCampaigns } from "@/lib/db/schema"

export async function GET() {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const campaigns = await db
    .select()
    .from(publisherEmailCampaigns)
    .where(eq(publisherEmailCampaigns.publisherId, session.publisherId))
    .orderBy(desc(publisherEmailCampaigns.createdAt))

  return NextResponse.json({ campaigns })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, subject, bodyHtml, bodyText, segmentFilter, scheduledAt } = body

  if (!name || !subject || !bodyHtml) {
    return NextResponse.json({ error: "name, subject, and bodyHtml are required" }, { status: 400 })
  }

  const [campaign] = await db
    .insert(publisherEmailCampaigns)
    .values({
      publisherId:   session.publisherId,
      name,
      subject,
      bodyHtml,
      bodyText:      bodyText ?? null,
      segmentFilter: segmentFilter ?? null,
      scheduledAt:   scheduledAt ? new Date(scheduledAt) : null,
      status:        scheduledAt ? "scheduled" : "draft",
    })
    .returning()

  return NextResponse.json({ campaign }, { status: 201 })
}
