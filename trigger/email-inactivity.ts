import { schedules, logger } from "@trigger.dev/sdk/v3"
import { and, eq, lt, isNull, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import {
  publisherEmailAutomations,
  readerSubscribers,
  readerSubscriptionLinks,
  readerPageVisits,
} from "@/lib/db/schema"
import { evaluateAutomations } from "@/lib/email/automations/engine"
import type { TriggerConfig } from "@/lib/email/automations/triggers"

// Runs daily at 06:00 UTC.
// For each publisher with an active "inactivity" automation, finds subscribers
// whose linked reader has had no page signal in the configured number of days,
// then fires the inactivity automation for each such subscriber.
export const emailInactivityCheck = schedules.task({
  id: "email-inactivity-check",
  cron: "0 6 * * *",
  run: async () => {
    // Find all active inactivity automations (distinct publishers)
    const automations = await db
      .select()
      .from(publisherEmailAutomations)
      .where(
        and(
          eq(publisherEmailAutomations.triggerType, "inactivity"),
          eq(publisherEmailAutomations.status, "active"),
        ),
      )

    if (automations.length === 0) {
      logger.info("No active inactivity automations")
      return { processed: 0 }
    }

    let fired = 0

    for (const automation of automations) {
      const config = automation.triggerConfig as TriggerConfig
      const inactiveDays = config.inactiveDays ?? 14
      const cutoff = new Date(Date.now() - inactiveDays * 86_400_000)

      // Find active, non-unsubscribed subscribers for this publisher that
      // have a linked reader whose most recent page visit is before the cutoff
      // (or who have never visited).
      type InactiveRow = { subscriber_id: string }
      const inactiveRows = await db.execute<InactiveRow>(sql`
        SELECT s.id AS subscriber_id
        FROM reader_subscribers s
        JOIN reader_subscription_links lnk ON lnk.subscriber_id = s.id
        WHERE s.publisher_id = ${automation.publisherId}
          AND s.active = true
          AND s.unsubscribed_at IS NULL
          AND (
            -- Never visited
            NOT EXISTS (
              SELECT 1 FROM reader_page_visits rpv
              WHERE rpv.reader_id = lnk.reader_id
            )
            OR
            -- Last visit is older than the cutoff
            (
              SELECT MAX(rpv.occurred_at) FROM reader_page_visits rpv
              WHERE rpv.reader_id = lnk.reader_id
            ) < ${cutoff}
          )
      `)

      logger.info("Inactivity check", {
        automationId: automation.id,
        publisherId:  automation.publisherId,
        inactiveDays,
        eligible:     inactiveRows.rows.length,
      })

      for (const row of inactiveRows.rows) {
        try {
          await evaluateAutomations({
            type:         "inactivity",
            publisherId:  automation.publisherId,
            subscriberId: row.subscriber_id,
          })
          fired++
        } catch (err) {
          logger.warn("Failed to fire inactivity automation", {
            subscriberId: row.subscriber_id,
            err,
          })
        }
      }
    }

    logger.info("Inactivity check complete", { automationsChecked: automations.length, fired })
    return { automationsChecked: automations.length, fired }
  },
})
