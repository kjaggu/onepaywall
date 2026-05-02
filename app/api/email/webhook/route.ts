import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { readerSubscribers, emailEvents } from "@/lib/db/schema"
import { normalizeSubscriberEmail, hashSubscriberEmail } from "@/lib/db/queries/reader-subscriptions"

// Resend webhook — handles bounce and complaint events to auto-suppress
// Configure in Resend dashboard: POST /api/email/webhook
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
  if (webhookSecret) {
    const sig = req.headers.get("svix-signature")
    if (!sig) return new NextResponse(null, { status: 401 })
    // Resend uses Svix for webhook signing; full verification requires the svix package.
    // In production, add `svix` to dependencies and verify here.
  }

  const body = await req.json().catch(() => null)
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
