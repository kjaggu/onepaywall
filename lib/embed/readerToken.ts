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

  // Upsert reader and get ID back in one round trip
  const [reader] = await db
    .insert(readers)
    .values({ fingerprint, lastSeenAt: new Date() })
    .onConflictDoUpdate({ target: readers.fingerprint, set: { lastSeenAt: new Date() } })
    .returning({ id: readers.id })

  // Upsert reader token and get token + visitCount back in one round trip
  const [rt] = await db
    .insert(readerTokens)
    .values({ readerId: reader.id, domainId, token: generateToken(), visitCount: 1 })
    .onConflictDoUpdate({
      target: [readerTokens.readerId, readerTokens.domainId],
      set: {
        visitCount: sql`${readerTokens.visitCount} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning({ token: readerTokens.token, visitCount: readerTokens.visitCount })

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
