import { and, eq, isNull, gt, inArray } from "drizzle-orm"
import { db } from "@/lib/db/client"
import {
  readerSubscribers,
  readerSubscriptionLinks,
  readerProfiles,
  readerSubscriptions,
} from "@/lib/db/schema"
import { decrypt } from "@/lib/payments/encrypt"

export type SegmentFilter = {
  segment?: "new" | "casual" | "regular" | "power_user"
  minMonetizationProbability?: number
  topicInterest?: string
  source?: string
  subscriptionStatus?: string
  adEngaged?: boolean
}

export type EmailSubscriber = {
  id: string
  email: string
  unsubscribeToken: string
}

export async function getSubscribersForFilter(
  publisherId: string,
  filter: SegmentFilter | null,
): Promise<EmailSubscriber[]> {
  // Base: active, not unsubscribed subscribers for this publisher
  const rows = await db
    .select({
      id:               readerSubscribers.id,
      encryptedEmail:   readerSubscribers.encryptedEmail,
      unsubscribeToken: readerSubscribers.unsubscribeToken,
      source:           readerSubscribers.source,
      readerId:         readerSubscriptionLinks.readerId,
    })
    .from(readerSubscribers)
    .leftJoin(
      readerSubscriptionLinks,
      eq(readerSubscriptionLinks.subscriberId, readerSubscribers.id),
    )
    .where(
      and(
        eq(readerSubscribers.publisherId, publisherId),
        eq(readerSubscribers.active, true),
        isNull(readerSubscribers.unsubscribedAt),
        filter?.source ? eq(readerSubscribers.source, filter.source) : undefined,
      ),
    )

  if (rows.length === 0) return []

  let subscriberIds = rows.map(r => r.id)

  // Profile-based filters require a reader_id link
  if (
    filter?.segment ||
    filter?.minMonetizationProbability !== undefined ||
    filter?.topicInterest ||
    filter?.adEngaged
  ) {
    const readerIds = rows
      .map(r => r.readerId)
      .filter((id): id is string => id !== null)

    if (readerIds.length === 0) return []

    const profiles = await db
      .select({
        readerId:                readerProfiles.readerId,
        segment:                 readerProfiles.segment,
        monetizationProbability: readerProfiles.monetizationProbability,
        topicInterests:          readerProfiles.topicInterests,
        adCompletionRate:        readerProfiles.adCompletionRate,
      })
      .from(readerProfiles)
      .where(inArray(readerProfiles.readerId, readerIds))

    const qualifyingReaderIds = new Set(
      profiles
        .filter(p => {
          if (filter.segment && p.segment !== filter.segment) return false
          if (
            filter.minMonetizationProbability !== undefined &&
            p.monetizationProbability < filter.minMonetizationProbability
          ) return false
          if (filter.topicInterest) {
            const interests = p.topicInterests as Record<string, number> | null
            if (!interests || (interests[filter.topicInterest] ?? 0) < 0.2) return false
          }
          if (filter.adEngaged && p.adCompletionRate <= 0) return false
          return true
        })
        .map(p => p.readerId),
    )

    const readerToSubscriber = new Map(
      rows.filter(r => r.readerId).map(r => [r.readerId!, r.id]),
    )
    subscriberIds = subscriberIds.filter(id => {
      const readerId = rows.find(r => r.id === id)?.readerId
      return readerId ? qualifyingReaderIds.has(readerId) : false
    })

    // suppress TypeScript unused warning
    void readerToSubscriber
  }

  // Subscription status filter
  if (filter?.subscriptionStatus && subscriberIds.length > 0) {
    const activeSubs = await db
      .select({ subscriberId: readerSubscriptions.subscriberId })
      .from(readerSubscriptions)
      .where(
        and(
          inArray(readerSubscriptions.subscriberId, subscriberIds),
          eq(readerSubscriptions.status, filter.subscriptionStatus),
        ),
      )
    const activeSet = new Set(activeSubs.map(s => s.subscriberId))
    subscriberIds = subscriberIds.filter(id => activeSet.has(id))
  }

  const qualifyingRows = rows.filter(r => subscriberIds.includes(r.id))
  return qualifyingRows.map(r => ({
    id:               r.id,
    email:            decrypt(r.encryptedEmail),
    unsubscribeToken: r.unsubscribeToken,
  }))
}
