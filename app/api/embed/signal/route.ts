import { NextRequest, NextResponse } from "next/server"
import { eq, sql } from "drizzle-orm"
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

    // Recompute profile every 5th visit for this reader across all domains.
    // visitCount from the token is already incremented by resolveReader on gate-check;
    // here we get the actual total across all domains for the trigger decision.
    const [countRow] = await db
      .select({ total: sql<number>`COUNT(*)::int` })
      .from(readerPageVisits)
      .where(eq(readerPageVisits.readerId, reader.readerId))
    const totalVisits = Number(countRow?.total ?? 0)
    if (totalVisits > 0 && totalVisits % 5 === 0) {
      // Enqueue via Trigger.dev — retries on failure, full run history in dashboard
      await computeProfileForReader.trigger({ readerId: reader.readerId }).catch(() => {})
    }
  })()

  return new NextResponse(null, { status: 204 })
}
