import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { Resend } from "resend"
import { getSession } from "@/lib/auth/session"
import { db } from "@/lib/db/client"
import { publisherEmailConfigs } from "@/lib/db/schema"
import { decrypt } from "@/lib/payments/encrypt"

export async function POST() {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [config] = await db
    .select()
    .from(publisherEmailConfigs)
    .where(eq(publisherEmailConfigs.publisherId, session.publisherId))
    .limit(1)

  if (!config) return NextResponse.json({ error: "Email not configured" }, { status: 404 })

  const resend = new Resend(decrypt(config.resendApiKey))
  const domain = config.fromEmail.split("@")[1]

  try {
    const { data, error } = await resend.domains.list()
    if (error || !data) {
      return NextResponse.json({ verified: false, error: error?.message })
    }

    const domainRecord = data.data.find(d => d.name === domain)
    const verified = domainRecord?.status === "verified"

    if (verified && !config.domainVerifiedAt) {
      await db
        .update(publisherEmailConfigs)
        .set({ domainVerifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(publisherEmailConfigs.id, config.id))
    }

    return NextResponse.json({ verified, status: domainRecord?.status ?? "not_found" })
  } catch (err) {
    return NextResponse.json({ verified: false, error: String(err) }, { status: 500 })
  }
}
