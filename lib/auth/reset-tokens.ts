import crypto from "crypto"
import { eq, and, gt } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { passwordResetTokens, users } from "@/lib/db/schema"
import { getUserByEmail } from "./users"

const TTL_MS = 60 * 60 * 1000 // 1 hour

export async function createResetToken(email: string): Promise<string | null> {
  const user = await getUserByEmail(email)
  if (!user) return null

  // Invalidate existing tokens for this user
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id))

  const token = crypto.randomBytes(32).toString("hex")
  await db.insert(passwordResetTokens).values({
    token,
    userId: user.id,
    expiresAt: new Date(Date.now() + TTL_MS),
  })
  return token
}

export async function consumeResetToken(token: string): Promise<string | null> {
  const [entry] = await db
    .select({ userId: passwordResetTokens.userId, usedAt: passwordResetTokens.usedAt })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date()),
      )
    )
    .limit(1)

  if (!entry || entry.usedAt) return null

  // Mark as used
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.token, token))

  const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, entry.userId)).limit(1)
  return user?.email ?? null
}
