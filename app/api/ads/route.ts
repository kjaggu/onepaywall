import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listAdUnits, createAdUnit } from "@/lib/db/queries/ads"

export async function GET() {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const units = await listAdUnits(session.publisherId)
  return NextResponse.json({ units })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, sourceType, mediaType, storageKey, cdnUrl, ctaLabel, ctaUrl, skipAfterSeconds } = body

  if (!name || !sourceType) {
    return NextResponse.json({ error: "name and sourceType are required" }, { status: 400 })
  }

  const unit = await createAdUnit(session.publisherId, {
    name,
    sourceType,
    mediaType,
    storageKey,
    cdnUrl,
    ctaLabel,
    ctaUrl,
    skipAfterSeconds: skipAfterSeconds ?? null,
  })

  return NextResponse.json({ unit }, { status: 201 })
}
