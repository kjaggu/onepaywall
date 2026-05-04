import { schedules, logger } from "@trigger.dev/sdk/v3"
import { and, eq, lte, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import {
  publisherEmailCampaigns,
  publisherEmailConfigs,
  emailEvents,
  readerSubscribers,
} from "@/lib/db/schema"
import { getSubscribersForFilter, type SegmentFilter } from "@/lib/email/segments"
import { sendEmail } from "@/lib/email/provider"
import { injectTracking } from "@/lib/email/tracking"
import { appendUnsubscribeFooter } from "@/lib/email/send-utils"

// Runs every 5 minutes. Finds campaigns whose scheduledAt has passed and
// transitions them from "scheduled" → sends → "sent".
// The send-campaign HTTP route handles manual "Send now" clicks; this job
// handles time-based scheduling.
export const emailCampaignScheduler = schedules.task({
  id: "email-campaign-scheduler",
  cron: "*/5 * * * *",
  run: async () => {
    const now = new Date()

    // Find campaigns due to send
    const due = await db
      .select()
      .from(publisherEmailCampaigns)
      .where(
        and(
          eq(publisherEmailCampaigns.status, "scheduled"),
          lte(publisherEmailCampaigns.scheduledAt, now),
        ),
      )

    if (due.length === 0) {
      logger.info("No scheduled campaigns due")
      return { processed: 0 }
    }

    logger.info(`Sending ${due.length} scheduled campaign(s)`)
    let totalSent = 0

    for (const campaign of due) {
      // Mark as sending immediately to prevent double-processing
      const [updated] = await db
        .update(publisherEmailCampaigns)
        .set({ status: "sending", updatedAt: now })
        .where(
          and(
            eq(publisherEmailCampaigns.id, campaign.id),
            eq(publisherEmailCampaigns.status, "scheduled"),
          ),
        )
        .returning({ id: publisherEmailCampaigns.id })

      if (!updated) {
        logger.warn("Campaign already claimed by another run", { campaignId: campaign.id })
        continue
      }

      const emailConfig = await db
        .select()
        .from(publisherEmailConfigs)
        .where(eq(publisherEmailConfigs.publisherId, campaign.publisherId))
        .limit(1)
        .then(r => r[0])

      if (!emailConfig) {
        logger.warn("No email config for publisher — skipping campaign", {
          campaignId: campaign.id,
          publisherId: campaign.publisherId,
        })
        await db
          .update(publisherEmailCampaigns)
          .set({ status: "draft", updatedAt: new Date() })
          .where(eq(publisherEmailCampaigns.id, campaign.id))
        continue
      }

      const subscribers = await getSubscribersForFilter(
        campaign.publisherId,
        campaign.segmentFilter as SegmentFilter | null,
      )

      let sent = 0

      for (const subscriber of subscribers) {
        const htmlWithTracking = injectTracking(campaign.bodyHtml, {
          campaignId:   campaign.id,
          subscriberId: subscriber.id,
        })
        const htmlWithFooter = appendUnsubscribeFooter(htmlWithTracking, subscriber.unsubscribeToken)

        try {
          await sendEmail(
            {
              to:        subscriber.email,
              subject:   campaign.subject,
              html:      htmlWithFooter,
              text:      campaign.bodyText ?? undefined,
              fromName:  emailConfig.fromName,
              fromEmail: emailConfig.fromEmail,
              replyTo:   emailConfig.replyTo ?? undefined,
            },
            emailConfig.resendApiKey,
          )

          await db.insert(emailEvents).values({
            campaignId:   campaign.id,
            subscriberId: subscriber.id,
            eventType:    "sent",
            metadata:     {},
          })

          sent++
        } catch (err) {
          logger.warn("Failed to send to subscriber", { subscriberId: subscriber.id, err })
        }
      }

      await db
        .update(publisherEmailCampaigns)
        .set({ status: "sent", sentAt: new Date(), recipientCount: sent, updatedAt: new Date() })
        .where(eq(publisherEmailCampaigns.id, campaign.id))

      logger.info("Campaign sent", { campaignId: campaign.id, sent })
      totalSent += sent
    }

    return { processed: due.length, totalSent }
  },
})
