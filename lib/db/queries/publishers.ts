import { eq, and, isNull } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { publishers, publisherMembers } from "@/lib/db/schema"

export async function getPublisherForUser(userId: string) {
  const [row] = await db
    .select({ publisher: publishers })
    .from(publisherMembers)
    .innerJoin(publishers, eq(publisherMembers.publisherId, publishers.id))
    .where(and(eq(publisherMembers.userId, userId), isNull(publishers.deletedAt)))
    .limit(1)
  return row?.publisher ?? null
}

export async function getPublisherById(publisherId: string) {
  const [row] = await db
    .select()
    .from(publishers)
    .where(and(eq(publishers.id, publisherId), isNull(publishers.deletedAt)))
    .limit(1)
  return row ?? null
}

export async function createPublisher({
  name,
  userId,
}: {
  name: string
  userId: string
}) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  const [publisher] = await db
    .insert(publishers)
    .values({ name, slug })
    .returning()

  await db.insert(publisherMembers).values({
    publisherId: publisher.id,
    userId,
    role: "owner",
  })

  return publisher
}

export async function updatePublisher(publisherId: string, data: Partial<{
  name: string
  currency: string
  timezone: string
}>) {
  const [row] = await db
    .update(publishers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(publishers.id, publisherId))
    .returning()
  return row
}
