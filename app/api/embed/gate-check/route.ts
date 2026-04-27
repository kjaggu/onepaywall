import { NextRequest, NextResponse } from "next/server"
import { eq, and, isNull } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { domains } from "@/lib/db/schema"
import { resolveReader } from "@/lib/embed/readerToken"
import { evaluateGate } from "@/lib/gates/evaluate"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const siteKey = searchParams.get("siteKey")
  const clientId = searchParams.get("clientId")
  const pageUrl = searchParams.get("url") ?? ""
  const deviceType = searchParams.get("device") ?? undefined

  if (!siteKey || !clientId) {
    return NextResponse.json({ error: "siteKey and clientId are required" }, { status: 400 })
  }

  // Look up domain by site key
  const [domain] = await db
    .select()
    .from(domains)
    .where(and(eq(domains.siteKey, siteKey), eq(domains.embedEnabled, true), isNull(domains.deletedAt)))
    .limit(1)

  if (!domain) {
    // Return pass-through — don't reveal whether domain exists
    return NextResponse.json({ gate: null }, {
      headers: { "Cache-Control": "private, no-cache" },
    })
  }

  const ua = req.headers.get("user-agent") ?? ""

  // Resolve (or create) reader + token, increment visit count
  const reader = await resolveReader(clientId, ua, domain.id)

  // Evaluate gate
  const result = await evaluateGate({
    domainId: domain.id,
    readerId: reader.readerId,
    visitCount: reader.visitCount,
    pageUrl,
    deviceType,
  })

  return NextResponse.json(
    { token: reader.token, ...result },
    { headers: { "Cache-Control": "private, no-cache" } },
  )
}
