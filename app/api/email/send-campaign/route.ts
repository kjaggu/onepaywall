import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { publisherEmailCampaigns, publisherEmailConfigs, emailEvents } from "@/lib/db/schema"
import { getSubscribersForFilter, type SegmentFilter } from "@/lib/email/segments"
import { sendEmail } from "@/lib/email/provider"
import { injectTracking } from "@/lib/email/tracking"
import { decrypt } from "@/lib/payments/encrypt"

// Internal endpoint — called by Trigger.dev job, not directly by users.
// Requires CRON_SECRET header to prevent unauthenticated access.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { campaignId } = await req.json()
  if (!campaignId) return NextResponse.json({ error: "Missing campaignId" }, { status: 400 })

  const [campaign] = await db
    .select()
    .from(publisherEmailCampaigns)
    .where(eq(publisherEmailCampaigns.id, campaignId))
    .limit(1)

  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
  if (campaign.status !== "sending") {
    return NextResponse.json({ error: "Campaign not in sending state" }, { status: 409 })
  }

  const [emailConfig] = await db
    .select()
    .from(publisherEmailConfigs)
    .where(eq(publisherEmailConfigs.publisherId, campaign.publisherId))
    .limit(1)

  if (!emailConfig) return NextResponse.json({ error: "Email not configured" }, { status: 404 })

  const subscribers = await getSubscribersForFilter(
    campaign.publisherId,
    campaign.segmentFilter as SegmentFilter | null,
  )

  let sent = 0
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? ""

  for (const subscriber of subscribers) {
    const htmlWithTracking = injectTracking(campaign.bodyHtml, {
      campaignId:   campaign.id,
      subscriberId: subscriber.id,
    })

    const htmlWithFooter = htmlWithTracking.includes("/api/email/unsubscribe/")
      ? htmlWithTracking
      : htmlWithTracking.replace(
          "</body>",
          `<p style="font-size:11px;color:#999;margin-top:32px">
            <a href="${BASE_URL}/api/email/unsubscribe/${subscriber.unsubscribeToken}">Unsubscribe</a>
          </p></body>`,
        )

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
    } catch {
      // Continue sending to other subscribers even if one fails
    }
  }

  await db
    .update(publisherEmailCampaigns)
    .set({ status: "sent", sentAt: new Date(), recipientCount: sent, updatedAt: new Date() })
    .where(eq(publisherEmailCampaigns.id, campaignId))

  return NextResponse.json({ sent })
}
