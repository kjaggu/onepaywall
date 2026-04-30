import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/client"
import { readerPageVisits } from "@/lib/db/schema"
import { getReaderByToken } from "@/lib/embed/readerToken"
import { sanitizeUrl } from "@/lib/intelligence/sanitize"
import { computeProfileForReader } from "@/trigger/compute-profiles"

export async function POST(req: NextRequest) {
  const body = await req.text().then(t => JSON.parse(t)).catch(() => null)
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

  const isSubscriber = typeof body.isSubscriber === "boolean" ? body.isSubscriber : null
  const gateShown = typeof body.gateShown === "boolean" ? body.gateShown : null

  // Fire-and-forget — don't await in critical path
  void (async () => {
    await db.insert(readerPageVisits).values({
      readerId: reader.readerId,
      domainId: reader.domainId,
      url,
      readTimeSeconds: typeof body.readTimeSeconds === "number" ? Math.min(body.readTimeSeconds, 3600) : undefined,
      scrollDepthPct: typeof body.scrollDepthPct === "number" ? Math.min(Math.max(body.scrollDepthPct, 0), 100) : undefined,
      deviceType,
      referrer,
      isSubscriber,
      gateShown,
    })

    // Enqueue a profile recompute on every signal. The task guards itself with a
    // 30-minute freshness check and exits early if the profile is already fresh —
    // so triggering here is cheap and new readers get a profile on their first visit.
    await computeProfileForReader.trigger({ readerId: reader.readerId }).catch(() => {})
  })()

  return new NextResponse(null, { status: 204 })
}
