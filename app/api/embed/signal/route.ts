import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/client"
import { readerPageVisits } from "@/lib/db/schema"
import { getReaderByToken } from "@/lib/embed/readerToken"
import { sanitizeUrl } from "@/lib/intelligence/sanitize"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.token || !body?.url) {
    return new NextResponse(null, { status: 204 })
  }

  const reader = await getReaderByToken(body.token)
  if (!reader) return new NextResponse(null, { status: 204 })

  const url = sanitizeUrl(String(body.url))
  const referrerRaw = typeof body.referrer === "string" ? body.referrer : undefined
  // Store only origin of referrer, not full path
  let referrer: string | undefined
  if (referrerRaw) {
    try { referrer = new URL(referrerRaw).origin } catch { /* ignore */ }
  }

  const validDevice = ["mobile", "desktop", "tablet"] as const
  const deviceType = validDevice.find(d => d === body.deviceType) ?? undefined

  // Fire-and-forget — don't await in critical path, just queue it
  void db.insert(readerPageVisits).values({
    readerId: reader.readerId,
    domainId: reader.domainId,
    url,
    readTimeSeconds: typeof body.readTimeSeconds === "number" ? Math.min(body.readTimeSeconds, 3600) : undefined,
    scrollDepthPct: typeof body.scrollDepthPct === "number" ? Math.min(Math.max(body.scrollDepthPct, 0), 100) : undefined,
    deviceType,
    referrer,
  })

  return new NextResponse(null, { status: 204 })
}
