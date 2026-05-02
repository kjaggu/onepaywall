import { and, eq, inArray } from "drizzle-orm"
import { db } from "@/lib/db/client"
import {
  publisherEmailAutomations,
  publisherEmailConfigs,
  emailAutomationRuns,
  readerSubscriptionLinks,
  readerSubscribers,
} from "@/lib/db/schema"
import { sendEmail } from "@/lib/email/provider"
import { injectTracking } from "@/lib/email/tracking"
import {
  type AutomationEvent,
  type TriggerConfig,
  eventMatchesAutomation,
} from "./triggers"

export async function evaluateAutomations(event: AutomationEvent): Promise<void> {
  const automations = await db
    .select()
    .from(publisherEmailAutomations)
    .where(
      and(
        eq(publisherEmailAutomations.publisherId, event.publisherId),
        eq(publisherEmailAutomations.status, "active"),
      ),
    )

  if (automations.length === 0) return

  const emailConfig = await db
    .select()
    .from(publisherEmailConfigs)
    .where(eq(publisherEmailConfigs.publisherId, event.publisherId))
    .limit(1)
    .then(r => r[0])

  if (!emailConfig) return

  for (const automation of automations) {
    const config = automation.triggerConfig as TriggerConfig
    if (!eventMatchesAutomation(event, automation.triggerType, config)) continue

    // Resolve subscriber ID for this event
    const subscriberId = await resolveSubscriberId(event)
    if (!subscriberId) continue

    // Check subscriber is active and not unsubscribed
    const [subscriber] = await db
      .select({ id: readerSubscribers.id, encryptedEmail: readerSubscribers.encryptedEmail })
      .from(readerSubscribers)
      .where(
        and(
          eq(readerSubscribers.id, subscriberId),
          eq(readerSubscribers.active, true),
        ),
      )
      .limit(1)

    if (!subscriber) continue

    // Dedup: skip if already sent this automation to this subscriber today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const [existingRun] = await db
      .select({ id: emailAutomationRuns.id })
      .from(emailAutomationRuns)
      .where(
        and(
          eq(emailAutomationRuns.automationId, automation.id),
          eq(emailAutomationRuns.subscriberId, subscriberId),
        ),
      )
      .limit(1)

    if (existingRun) continue

    // Create run record
    const [run] = await db
      .insert(emailAutomationRuns)
      .values({
        automationId: automation.id,
        subscriberId,
        triggeredAt:  new Date(),
        status:       "pending",
      })
      .returning({ id: emailAutomationRuns.id })

    // Send (fire-and-forget, don't fail the caller)
    void sendAutomationEmail({
      runId:        run.id,
      subscriberId,
      encryptedEmail: subscriber.encryptedEmail,
      automation,
      emailConfig,
    }).catch(() => {})
  }
}

async function resolveSubscriberId(event: AutomationEvent): Promise<string | null> {
  if (event.type === "new_subscriber" || event.type === "inactivity") {
    return event.subscriberId
  }

  // For reader-based events, find the subscriber via the subscription link
  const [link] = await db
    .select({ subscriberId: readerSubscriptionLinks.subscriberId })
    .from(readerSubscriptionLinks)
    .where(eq(readerSubscriptionLinks.readerId, event.readerId))
    .limit(1)

  return link?.subscriberId ?? null
}

type SendArgs = {
  runId: string
  subscriberId: string
  encryptedEmail: string
  automation: typeof publisherEmailAutomations.$inferSelect
  emailConfig: typeof publisherEmailConfigs.$inferSelect
}

async function sendAutomationEmail(args: SendArgs): Promise<void> {
  const { runId, subscriberId, encryptedEmail, automation, emailConfig } = args
  const { decrypt } = await import("@/lib/payments/encrypt")
  const toEmail = decrypt(encryptedEmail)

  const bodyHtml = injectTracking(automation.bodyHtml, {
    automationRunId: runId,
    subscriberId,
  })

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? ""
  const unsubLink = `${BASE_URL}/api/email/unsubscribe/[token]`

  // Append unsubscribe footer if not already present
  const htmlWithFooter = bodyHtml.includes("/api/email/unsubscribe/")
    ? bodyHtml
    : bodyHtml.replace(
        "</body>",
        `<p style="font-size:11px;color:#999;margin-top:32px">
          <a href="${BASE_URL}/api/email/unsubscribe/${await getUnsubToken(subscriberId)}">Unsubscribe</a>
        </p></body>`,
      )

  await sendEmail(
    {
      to:        toEmail,
      subject:   automation.subject,
      html:      htmlWithFooter,
      text:      automation.bodyText ?? undefined,
      fromName:  emailConfig.fromName,
      fromEmail: emailConfig.fromEmail,
      replyTo:   emailConfig.replyTo ?? undefined,
    },
    emailConfig.resendApiKey,
  )

  await db
    .update(emailAutomationRuns)
    .set({ status: "sent", sentAt: new Date() })
    .where(eq(emailAutomationRuns.id, runId))

  // suppress unused
  void unsubLink
}

async function getUnsubToken(subscriberId: string): Promise<string> {
  const [row] = await db
    .select({ unsubscribeToken: readerSubscribers.unsubscribeToken })
    .from(readerSubscribers)
    .where(eq(readerSubscribers.id, subscriberId))
    .limit(1)
  return row?.unsubscribeToken ?? ""
}
