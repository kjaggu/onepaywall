import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { publisherWebhooks } from "@/lib/db/schema"

export type PublisherWebhook = typeof publisherWebhooks.$inferSelect

export async function listPublisherWebhooks(publisherId: string): Promise<PublisherWebhook[]> {
  return db
    .select()
    .from(publisherWebhooks)
    .where(eq(publisherWebhooks.publisherId, publisherId))
    .orderBy(publisherWebhooks.createdAt)
}

export async function createPublisherWebhook(input: {
  publisherId: string
  event: string
  url: string
}): Promise<PublisherWebhook> {
  const [row] = await db
    .insert(publisherWebhooks)
    .values(input)
    .returning()
  return row
}

export async function updatePublisherWebhook(
  id: string,
  publisherId: string,
  patch: Partial<{ url: string; active: boolean }>,
): Promise<PublisherWebhook | null> {
  const [row] = await db
    .update(publisherWebhooks)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(publisherWebhooks.id, id), eq(publisherWebhooks.publisherId, publisherId)))
    .returning()
  return row ?? null
}

export async function deletePublisherWebhook(id: string, publisherId: string): Promise<void> {
  await db
    .delete(publisherWebhooks)
    .where(and(eq(publisherWebhooks.id, id), eq(publisherWebhooks.publisherId, publisherId)))
}
