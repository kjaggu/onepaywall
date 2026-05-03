import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { readerSubscribers, emailEvents } from "@/lib/db/schema"
import { normalizeSubscriberEmail, hashSubscriberEmail } from "@/lib/db/queries/reader-subscriptions"

// Svix webhook signature verification (Resend uses Svix for webhook signing).
// Protocol: HMAC-SHA256( secret, "${svix-id}.${svix-timestamp}.${rawBody}" )
// Timestamp must be within 5 minutes to prevent replay attacks.
function verifySvixSignature(
  secret: string,
  svixId: string,
  svixTimestamp: string,
  rawBody: string,
  svixSignature: string,
): boolean {
  const tsMs = Number(svixTimestamp) * 1000
  if (isNaN(tsMs) || Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) return false

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64")
  const toSign = `${svixId}.${svixTimestamp}.${rawBody}`
  const computed = createHmac("sha256", secretBytes).update(toSign).digest("base64")

  // svix-signature can be a space-separated list of "v1,<base64>" values
  return svixSignature.split(" ").some(part => {
    const [version, sig] = part.split(",")
    if (version !== "v1" || !sig) return false
    const a = Buffer.from(computed)
    const b = Buffer.from(sig)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  })
}

// Resend webhook — handles bounce and complaint events to auto-suppress
// Configure in Resend dashboard: POST /api/email/webhook
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  const rawBody = await req.text()

  if (webhookSecret) {
    const svixId        = req.headers.get("svix-id") ?? ""
    const svixTimestamp = req.headers.get("svix-timestamp") ?? ""
    const svixSignature = req.headers.get("svix-signature") ?? ""

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new NextResponse(null, { status: 401 })
    }

    if (!verifySvixSignature(webhookSecret, svixId, svixTimestamp, rawBody, svixSignature)) {
      return new NextResponse(null, { status: 401 })
    }
  }

  let body: { type?: string; data?: { email?: string } } | null = null
  try { body = JSON.parse(rawBody) } catch { /* fall through to 204 */ }
  if (!body?.type || !body?.data) return new NextResponse(null, { status: 204 })

  const eventType: string = body.type
  const emailAddress: string | undefined = body.data?.email

  if (!emailAddress) return new NextResponse(null, { status: 204 })

  // Map Resend event types to our internal types
  const internalType =
    eventType === "email.bounced"    ? "bounced"    :
    eventType === "email.complained" ? "complained" :
    null

  if (!internalType) return new NextResponse(null, { status: 204 })

  const normalized = normalizeSubscriberEmail(emailAddress)
  const emailHash  = hashSubscriberEmail(normalized)

  // Find all subscribers with this email hash and suppress them
  const subscribers = await db
    .select({ id: readerSubscribers.id })
    .from(readerSubscribers)
    .where(eq(readerSubscribers.emailHash, emailHash))

  for (const sub of subscribers) {
    await db
      .update(readerSubscribers)
      .set({ unsubscribedAt: new Date(), updatedAt: new Date() })
      .where(eq(readerSubscribers.id, sub.id))

    await db.insert(emailEvents).values({
      subscriberId: sub.id,
      eventType:    internalType,
      metadata:     { resendEventType: eventType },
    })
  }

  return new NextResponse(null, { status: 204 })
}
