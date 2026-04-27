import { db } from "@/lib/db/client"
import { publishers, publisherMembers } from "@/lib/db/schema"
import { createUser, getUserByEmail } from "@/lib/auth/users"
import { createTrialSubscription, getPlan } from "@/lib/db/queries/billing"

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

export type RegisterResult =
  | { ok: true; userId: string; publisherId: string; email: string; name: string }
  | { ok: false; error: string; status: number }

export async function registerPublisher(opts: {
  name: string
  publicationName: string
  email: string
  password: string
}): Promise<RegisterResult> {
  const { name, publicationName, email, password } = opts

  const existing = await getUserByEmail(email)
  if (existing) {
    return { ok: false, error: "An account with this email already exists.", status: 409 }
  }

  const user = await createUser(email, password, name)

  const baseSlug = toSlug(publicationName) || "publisher"
  const slug = `${baseSlug}-${Date.now().toString(36)}`

  const [publisher] = await db
    .insert(publishers)
    .values({ name: publicationName, slug })
    .returning({ id: publishers.id })

  await db.insert(publisherMembers).values({
    publisherId: publisher.id,
    userId: user.id,
    role: "owner",
  })

  // Trial of Starter — 14 days. Trial length is sourced from the plans
  // table so it can be tuned without redeploying.
  const starter = await getPlan("starter")
  const trialDays = starter?.trialDays ?? 14
  await createTrialSubscription({
    publisherId: publisher.id,
    planSlug:    "starter",
    trialDays,
  })

  return { ok: true, userId: user.id, publisherId: publisher.id, email: user.email, name: user.name }
}
