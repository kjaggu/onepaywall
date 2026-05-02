import { NextRequest, NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db/client"
import { publisherEmailCampaigns } from "@/lib/db/schema"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const allowed = ["name", "subject", "bodyHtml", "bodyText", "segmentFilter", "scheduledAt", "status"]
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  updates.updatedAt = new Date()

  const [updated] = await db
    .update(publisherEmailCampaigns)
    .set(updates)
    .where(
      and(
        eq(publisherEmailCampaigns.id, id),
        eq(publisherEmailCampaigns.publisherId, session.publisherId),
      ),
    )
    .returning()

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ campaign: updated })
}
