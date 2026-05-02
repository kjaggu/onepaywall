import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/client"
import { pageEvents } from "@/lib/db/schema"
import { getReaderByToken } from "@/lib/embed/readerToken"
import { sanitizeUrl } from "@/lib/intelligence/sanitize"
import { classifyContent } from "@/lib/intelligence/classifyContent"

const VALID_EVENT_TYPES = new Set(["page_view", "read_complete"])

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.token || !body?.eventType || !body?.url) {
    return new NextResponse(null, { status: 204 })
  }

  if (!VALID_EVENT_TYPES.has(body.eventType)) {
    return new NextResponse(null, { status: 204 })
  }

  const reader = await getReaderByToken(body.token)
  if (!reader) return new NextResponse(null, { status: 204 })

  const url = sanitizeUrl(body.url)

  let referrerOrigin: string | null = null
  if (typeof body.referrer === "string" && body.referrer) {
    try { referrerOrigin = new URL(body.referrer).origin } catch { /* ignore */ }
  }

  // Fire-and-forget — classify URL and write event; never block the response
  void (async () => {
    try {
      const { categories } = await classifyContent(url)
      await db.insert(pageEvents).values({
        domainId:        reader.domainId,
        readerId:        reader.readerId,
        eventType:       body.eventType,
        url,
        referrer:        referrerOrigin,
        contentCategory: categories[0] ?? null,
        readTimeSeconds: typeof body.readTimeSeconds === "number" ? body.readTimeSeconds : null,
        scrollDepthPct:  typeof body.scrollDepthPct === "number" ? body.scrollDepthPct : null,
      })
    } catch { /* best-effort; never surface errors to the embed */ }
  })()

  return new NextResponse(null, { status: 204 })
}
