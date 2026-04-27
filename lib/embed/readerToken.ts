import { eq, and, sql } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { readers, readerTokens } from "@/lib/db/schema"
import { computeFingerprint, generateToken } from "./fingerprint"

export type ReaderContext = {
  readerId: string
  token: string
  visitCount: number
}

export async function resolveReader(
  clientId: string,
  userAgent: string,
  domainId: string,
): Promise<ReaderContext> {
  const fingerprint = computeFingerprint(clientId, userAgent)

  // Upsert reader (update last_seen_at on conflict)
  await db
    .insert(readers)
    .values({ fingerprint, lastSeenAt: new Date() })
    .onConflictDoUpdate({ target: readers.fingerprint, set: { lastSeenAt: new Date() } })

  const [reader] = await db
    .select({ id: readers.id })
    .from(readers)
    .where(eq(readers.fingerprint, fingerprint))
    .limit(1)

  // Upsert reader token — create on first visit, increment count on repeat
  await db
    .insert(readerTokens)
    .values({ readerId: reader.id, domainId, token: generateToken(), visitCount: 1 })
    .onConflictDoUpdate({
      target: [readerTokens.readerId, readerTokens.domainId],
      set: {
        visitCount: sql`${readerTokens.visitCount} + 1`,
        updatedAt: new Date(),
      },
    })

  const [rt] = await db
    .select({ token: readerTokens.token, visitCount: readerTokens.visitCount })
    .from(readerTokens)
    .where(and(eq(readerTokens.readerId, reader.id), eq(readerTokens.domainId, domainId)))
    .limit(1)

  return { readerId: reader.id, token: rt.token, visitCount: rt.visitCount }
}

export async function getReaderByToken(token: string): Promise<{ readerId: string; domainId: string } | null> {
  const [rt] = await db
    .select({ readerId: readerTokens.readerId, domainId: readerTokens.domainId })
    .from(readerTokens)
    .where(eq(readerTokens.token, token))
    .limit(1)
  return rt ?? null
}
