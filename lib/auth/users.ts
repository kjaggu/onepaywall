import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { users, publisherMembers } from "@/lib/db/schema"

export type AuthUser = {
  id: string
  email: string
  role: "superadmin" | "publisher"
  name: string
  publisherId?: string
  emailVerified: boolean
}

export async function verifyUser(email: string, password: string): Promise<AuthUser | null> {
  const normalised = email.toLowerCase().trim()
  const [user] = await db.select().from(users).where(eq(users.email, normalised)).limit(1)
  if (!user || user.deletedAt) return null

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return null

  let publisherId: string | undefined
  if (user.role === "publisher") {
    const [membership] = await db
      .select({ publisherId: publisherMembers.publisherId })
      .from(publisherMembers)
      .where(eq(publisherMembers.userId, user.id))
      .limit(1)
    publisherId = membership?.publisherId
  }

  return { id: user.id, email: user.email, role: user.role, name: user.name, publisherId, emailVerified: !!user.emailVerifiedAt }
}

export async function createUser(email: string, password: string, name: string) {
  const passwordHash = await bcrypt.hash(password, 12)
  const [user] = await db
    .insert(users)
    .values({ email: email.toLowerCase().trim(), passwordHash, name, role: "publisher" })
    .returning({ id: users.id, email: users.email, name: users.name, role: users.role })
  return user
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1)
  return user ?? null
}

export async function updatePasswordHash(userId: string, newHash: string) {
  await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, userId))
}

export async function markEmailVerified(userId: string) {
  await db.update(users).set({ emailVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, userId))
}
