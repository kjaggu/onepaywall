import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db/client"
import { subscriptions } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const email = session.email
  const initials = email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s: string) => s[0].toUpperCase())
    .join("")
    .slice(0, 2)

  let plan: string | null = null
  if (session.publisherId) {
    const [sub] = await db
      .select({ planSlug: subscriptions.planSlug })
      .from(subscriptions)
      .where(eq(subscriptions.publisherId, session.publisherId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1)
    plan = sub?.planSlug ?? null
  }

  return NextResponse.json({ email, initials, plan })
}
