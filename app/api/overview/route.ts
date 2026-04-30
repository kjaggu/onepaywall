import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listDomains } from "@/lib/db/queries/domains"
import { getSummary, getDomainBreakdown, getHourlyDecisions } from "@/lib/db/queries/analytics"
import { getSubscriberStats } from "@/lib/db/queries/reader-subscriptions"
import { getRevenueForPeriod, getRevenueByDomain } from "@/lib/db/queries/transactions"

export async function GET() {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { publisherId } = session

  const domainList = await listDomains(publisherId)
  const domainIds = domainList.map(d => d.id)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [summary, domainBreakdown, hourly, subscriberStats, revenueThisMonth, revenueByDomain] =
    await Promise.all([
      getSummary(domainIds, thirtyDaysAgo),
      getDomainBreakdown(domainIds, thirtyDaysAgo),
      getHourlyDecisions(domainIds),
      getSubscriberStats(publisherId),
      getRevenueForPeriod(publisherId, startOfMonth),
      getRevenueByDomain(publisherId, domainIds, thirtyDaysAgo),
    ])

  const breakdownMap = new Map(domainBreakdown.map(d => [d.domainId, d]))

  const domains = domainList.map(d => {
    const stats = breakdownMap.get(d.id)
    const rev = revenueByDomain[d.id]
    return {
      id: d.id,
      name: d.name,
      domain: d.domain,
      status: d.status,
      embedEnabled: d.embedEnabled,
      impressions30d: stats?.impressions ?? 0,
      conversionRate30d: stats?.conversionRate ?? 0,
      revenue30d: rev?.total ?? 0,
      currency: rev?.currency ?? revenueThisMonth.currency,
    }
  })

  // Generate alerts from real state
  const alerts: Array<{ type: "warning" | "info" | "muted"; domain: string; message: string }> = []
  for (const d of domainList) {
    if (d.status === "paused") {
      alerts.push({ type: "muted", domain: d.domain, message: "Gate paused by publisher" })
    } else if (!d.embedEnabled) {
      alerts.push({ type: "info", domain: d.domain, message: "Embed not yet detected on this domain" })
    }
  }
  if (subscriberStats.past_due > 0) {
    alerts.push({ type: "warning", domain: "Subscriptions", message: `${subscriberStats.past_due} subscription${subscriberStats.past_due > 1 ? "s" : ""} past due` })
  }

  return NextResponse.json({
    summary: {
      revenueThisMonth: revenueThisMonth.total,
      currency: revenueThisMonth.currency,
      activeSubscribers: subscriberStats.active,
      conversionRate30d: summary.conversionRate,
      impressions30d: summary.impressions,
      domainsLive: domainList.filter(d => d.embedEnabled && d.status === "active").length,
      totalDomains: domainList.length,
    },
    domains,
    hourly,
    alerts,
  })
}
