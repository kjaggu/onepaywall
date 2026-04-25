import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { users } from "@/lib/db/schema"

export type AuthUser = {
  id: string
  email: string
  role: "superadmin" | "publisher"
  name: string
  publisherId?: string
}

export async function verifyUser(email: string, password: string): Promise<AuthUser | null> {
  const normalised = email.toLowerCase().trim()
  const [user] = await db.select().from(users).where(eq(users.email, normalised)).limit(1)
  if (!user) return null

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return null

  return { id: user.id, email: user.email, role: user.role, name: user.name }
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1)
  return user ?? null
}

export async function updatePasswordHash(userId: string, newHash: string) {
  await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, userId))
}
