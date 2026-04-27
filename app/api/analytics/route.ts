import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listDomains } from "@/lib/db/queries/domains"
import { getSummary, getDailySeries } from "@/lib/db/queries/analytics"
import { refreshRollups } from "@/lib/analytics/rollup"

function since(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET() {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const domains = await listDomains(session.publisherId)
  const domainIds = domains.map(d => d.id)
  const from = since(30)

  // Refresh rollups for the window, then read from them for the chart
  await refreshRollups(domainIds, from)

  const [summary, daily] = await Promise.all([
    getSummary(domainIds, from),
    getDailySeries(domainIds, from),
  ])

  return NextResponse.json({ summary, daily })
}
