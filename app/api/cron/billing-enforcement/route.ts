import { NextRequest, NextResponse } from "next/server"
import { and, eq, lt } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { subscriptions } from "@/lib/db/schema"

// Hourly cron: transitions subscriptions through time-based state machine.
// 1. past_due → suspended after 7 days of failed dunning
// 2. trialing → suspended once current_period_end has passed (publisher
//    didn't subscribe before trial ended)
//
// In production this is gated by Vercel's CRON_SECRET. In dev we allow
// unauthenticated calls so we can hit it manually for testing.
//
// Schedule: see vercel.json.

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  if (process.env.NODE_ENV === "production" && expected) {
    const provided = req.headers.get("authorization")
    if (provided !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS)

  // 1. past_due > 7 days → suspended.
  const dunningExpired = await db
    .update(subscriptions)
    .set({ status: "suspended", updatedAt: now })
    .where(and(
      eq(subscriptions.status, "past_due"),
      lt(subscriptions.dunningStartedAt, sevenDaysAgo),
    ))
    .returning({ id: subscriptions.id, publisherId: subscriptions.publisherId })

  // 2. trial expired (currentPeriodEnd in past) → suspended.
  const trialExpired = await db
    .update(subscriptions)
    .set({ status: "suspended", updatedAt: now })
    .where(and(
      eq(subscriptions.status, "trialing"),
      lt(subscriptions.currentPeriodEnd, now),
    ))
    .returning({ id: subscriptions.id, publisherId: subscriptions.publisherId })

  return NextResponse.json({
    ranAt: now.toISOString(),
    dunningExpired: dunningExpired.length,
    trialExpired:   trialExpired.length,
  })
}
