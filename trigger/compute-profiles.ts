import { task, schedules, logger } from "@trigger.dev/sdk/v3"
import { computeProfile } from "@/lib/intelligence/computeProfile"
import { getReaderProfile, getStalePotentialProfileReaderIds } from "@/lib/db/queries/reader-intelligence"

const FRESHNESS_MS = 30 * 60 * 1000 // skip recompute if profile is <30 min old

// ─── On-demand: recompute a single reader's profile ──────────────────────────
// Triggered on every page signal and on gate_passed/ad_complete events.
// Guards itself with a freshness check — if the profile was computed in the
// last 30 minutes, the task exits early. This means we can safely trigger on
// every signal without over-computing: new readers get a profile on their very
// first visit, active readers don't get redundant recomputes.

export const computeProfileForReader = task({
  id: "compute-profile-reader",
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 500,
    maxTimeoutInMs: 5000,
    factor: 2,
  },
  run: async (payload: { readerId: string }) => {
    const existing = await getReaderProfile(payload.readerId)
    if (existing) {
      const ageMs = Date.now() - existing.lastComputedAt.getTime()
      if (ageMs < FRESHNESS_MS) {
        logger.info("Profile fresh, skipping", { readerId: payload.readerId, ageMs })
        return { skipped: true }
      }
    }
    logger.info("Computing profile", { readerId: payload.readerId })
    await computeProfile(payload.readerId)
    logger.info("Profile computed", { readerId: payload.readerId })
    return { skipped: false }
  },
})

// ─── Scheduled: daily batch sweep ────────────────────────────────────────────
// Catches readers whose real-time trigger missed (e.g. Trigger.dev was down,
// or a low-frequency reader who hasn't visited in >30 min but has stale data).
// Runs at 02:00 UTC daily.

export const computeProfilesDaily = schedules.task({
  id: "compute-profiles-daily",
  cron: "0 2 * * *",
  run: async () => {
    const BATCH_SIZE = 200
    const readerIds = await getStalePotentialProfileReaderIds(BATCH_SIZE)
    logger.info("Starting daily profile batch", { total: readerIds.length })

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
