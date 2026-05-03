import crypto from "crypto"
import { eq, and, gt } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { emailVerificationTokens, users } from "@/lib/db/schema"

const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export async function createVerificationToken(userId: string): Promise<string> {
  // Invalidate any existing tokens for this user
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId))

  const token = crypto.randomBytes(32).toString("hex")
  await db.insert(emailVerificationTokens).values({
    token,
    userId,
    expiresAt: new Date(Date.now() + TTL_MS),
  })
  return token
}

// Returns the userId if the token is valid and unused, null otherwise.
export async function consumeVerificationToken(token: string): Promise<string | null> {
  const [entry] = await db
    .select({ userId: emailVerificationTokens.userId, usedAt: emailVerificationTokens.usedAt })
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.token, token),
        gt(emailVerificationTokens.expiresAt, new Date()),
      ),
    )
    .limit(1)

  if (!entry || entry.usedAt) return null

  await db
    .update(emailVerificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(emailVerificationTokens.token, token))

  return entry.userId
}

export async function isEmailVerified(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return !!user?.emailVerifiedAt
}
