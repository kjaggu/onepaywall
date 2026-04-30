import { NextRequest, NextResponse } from "next/server"
import { computeProfile } from "@/lib/intelligence/computeProfile"
import { getStalePotentialProfileReaderIds } from "@/lib/db/queries/reader-intelligence"

// Daily cron: finds readers with new signals since their last profile computation
// and recomputes their profile in batches of 100.
//
// Gated by CRON_SECRET in production (same pattern as billing-enforcement).
// Schedule: see vercel.json.

const BATCH_SIZE = 100

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  if (process.env.NODE_ENV === "production" && expected) {
    const provided = req.headers.get("authorization")
    if (provided !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  const readerIds = await getStalePotentialProfileReaderIds(BATCH_SIZE)

  let succeeded = 0
  let failed = 0

  // Process sequentially to avoid overwhelming Neon's connection pool
  for (const readerId of readerIds) {
    try {
      await computeProfile(readerId)
      succeeded++
    } catch {
      failed++
    }
  }

  return NextResponse.json({
    ranAt:     new Date().toISOString(),
    processed: readerIds.length,
    succeeded,
    failed,
  })
}
