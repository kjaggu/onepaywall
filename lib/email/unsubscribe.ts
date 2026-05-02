import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { readerSubscribers, emailEvents, publishers } from "@/lib/db/schema"

export type UnsubscribeResult =
  | { ok: true; publisherName: string }
  | { ok: false; reason: "not_found" | "already_unsubscribed" }

export async function handleUnsubscribe(token: string): Promise<UnsubscribeResult> {
  const [subscriber] = await db
    .select({
      id:             readerSubscribers.id,
      publisherId:    readerSubscribers.publisherId,
      unsubscribedAt: readerSubscribers.unsubscribedAt,
    })
    .from(readerSubscribers)
    .where(eq(readerSubscribers.unsubscribeToken, token))
    .limit(1)

  if (!subscriber) return { ok: false, reason: "not_found" }
  if (subscriber.unsubscribedAt) return { ok: false, reason: "already_unsubscribed" }

  await db
    .update(readerSubscribers)
    .set({ unsubscribedAt: new Date(), updatedAt: new Date() })
    .where(eq(readerSubscribers.id, subscriber.id))

  await db.insert(emailEvents).values({
    subscriberId: subscriber.id,
    eventType:    "unsubscribed",
    metadata:     {},
  })

  const [pub] = await db
    .select({ name: publishers.name })
    .from(publishers)
    .where(eq(publishers.id, subscriber.publisherId))
    .limit(1)

  return { ok: true, publisherName: pub?.name ?? "" }
}
