import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { subscriberTags } from "@/lib/db/schema"

export async function getSubscriberTags(subscriberId: string): Promise<string[]> {
  const rows = await db
    .select({ tag: subscriberTags.tag })
    .from(subscriberTags)
    .where(eq(subscriberTags.subscriberId, subscriberId))
  return rows.map(r => r.tag)
}

export async function addSubscriberTag(
  subscriberId: string,
  publisherId: string,
  tag: string,
): Promise<void> {
  await db
    .insert(subscriberTags)
    .values({ subscriberId, publisherId, tag: tag.trim().toLowerCase() })
    .onConflictDoNothing()
}

export async function removeSubscriberTag(
  subscriberId: string,
  publisherId: string,
  tag: string,
): Promise<void> {
  await db
    .delete(subscriberTags)
    .where(and(
      eq(subscriberTags.subscriberId, subscriberId),
      eq(subscriberTags.publisherId, publisherId),
      eq(subscriberTags.tag, tag),
    ))
}
