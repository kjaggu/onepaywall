import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listSubscribers, getSubscriberStats, createManualSubscription } from "@/lib/db/queries/reader-subscriptions"
import { getBrand, getDefaultBrand } from "@/lib/db/queries/brands"

const VALID_INTERVALS = ["monthly", "quarterly", "annual", "lifetime"] as const

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get("status") ?? undefined
  const brandId = searchParams.get("brandId") ?? undefined

  const [subscribers, stats] = await Promise.all([
    listSubscribers(session.publisherId, { status, brandId }),
    getSubscriberStats(session.publisherId, brandId),
  ])

  return NextResponse.json({ subscribers, stats })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { email, interval, expiresAt, paymentMethod, notes, brandId: brandIdParam } = body

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }
  if (!interval || !VALID_INTERVALS.includes(interval)) {
    return NextResponse.json({ error: `interval must be one of: ${VALID_INTERVALS.join(", ")}` }, { status: 400 })
  }

  const brand = brandIdParam
    ? await getBrand(brandIdParam, session.publisherId)
    : await getDefaultBrand(session.publisherId)

  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 })

  const result = await createManualSubscription({
    publisherId: session.publisherId,
    brandId: brand.id,
    email,
    interval,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    paymentMethod: paymentMethod ?? null,
    notes: notes ?? null,
  })

  if (result.alreadyActive) {
    return NextResponse.json({ error: "Subscriber already has an active subscription" }, { status: 409 })
  }

  return NextResponse.json({ subscriber: result.subscriber, subscription: result.subscription }, { status: 201 })
}
