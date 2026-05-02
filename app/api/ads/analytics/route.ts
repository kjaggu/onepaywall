import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listDomains } from "@/lib/db/queries/domains"
import {
  getAdUnitStats,
  getAdSegmentStats,
  getAdCategoryStats,
  getAdAnalyticsSummary,
} from "@/lib/db/queries/ad-analytics"

function since(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const range = Number(req.nextUrl.searchParams.get("range") ?? "30")
  const days = [7, 30, 90].includes(range) ? range : 30
  const from = since(days)

  const domains = await listDomains(session.publisherId)
  const domainIds = domains.map(d => d.id)

  const [summary, byUnit, bySegment, byCategory] = await Promise.all([
    getAdAnalyticsSummary(domainIds, from),
    getAdUnitStats(domainIds, from),
    getAdSegmentStats(domainIds, from),
    getAdCategoryStats(domainIds, from),
  ])

  return NextResponse.json({ summary, byUnit, bySegment, byCategory })
}
