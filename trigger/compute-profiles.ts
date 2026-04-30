import { task, schedules, logger } from "@trigger.dev/sdk/v3"
import { computeProfile } from "@/lib/intelligence/computeProfile"
import { getStalePotentialProfileReaderIds } from "@/lib/db/queries/reader-intelligence"

// ─── On-demand: recompute a single reader's profile ──────────────────────────
// Called from embed signal + event routes whenever a meaningful action occurs
// (every 5th page signal, gate_passed, ad_complete). Using Trigger.dev instead
// of fire-and-forget ensures retries on failure and full run observability.

export const computeProfileForReader = task({
  id: "compute-profile-reader",
  // Retry up to 3 times with exponential backoff — profile computation can
  // transiently fail if Neon cold-starts or content classification hits rate limits
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 500,
    maxTimeoutInMs: 5000,
    factor: 2,
  },
  run: async (payload: { readerId: string }) => {
    logger.info("Computing profile", { readerId: payload.readerId })
    await computeProfile(payload.readerId)
    logger.info("Profile computed", { readerId: payload.readerId })
  },
})

// ─── Scheduled: daily batch sweep ────────────────────────────────────────────
// Catches any readers whose profile is stale but whose real-time trigger
// didn't fire (e.g. server restarted mid-computation, or a reader with low
// visit frequency that never hit the every-5th threshold recently).
// Runs at 02:00 UTC daily.

export const computeProfilesDaily = schedules.task({
  id: "compute-profiles-daily",
  cron: "0 2 * * *",
  run: async () => {
    const BATCH_SIZE = 200
    const readerIds = await getStalePotentialProfileReaderIds(BATCH_SIZE)
    logger.info(`Starting daily profile batch`, { total: readerIds.length })

    let succeeded = 0
    let failed = 0

    for (const readerId of readerIds) {
      try {
        await computeProfile(readerId)
        succeeded++
      } catch (err) {
        logger.warn("Profile computation failed for reader", { readerId, err })
        failed++
      }
    }

    logger.info("Daily profile batch complete", { succeeded, failed })
    return { processed: readerIds.length, succeeded, failed }
  },
})
