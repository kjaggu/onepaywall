import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import {
  getPublisherReaderPlan,
  upsertPublisherReaderPlan,
  listContentPrices,
  addContentPrice,
  getReaderPlanSyncStatus,
  syncPublisherReaderSubscriptionPlans,
} from "@/lib/db/queries/publisher-plans"
import { getOrCreatePgConfig } from "@/lib/db/queries/pg-configs"

export async function GET() {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [plan, contentPrices, pgConfig] = await Promise.all([
    getPublisherReaderPlan(session.publisherId),
    listContentPrices(session.publisherId),
    getOrCreatePgConfig(session.publisherId),
  ])

  return NextResponse.json({
    plan,
    contentPrices,
    syncStatus: getReaderPlanSyncStatus(plan, pgConfig.mode),
    paymentGateway: {
      mode: pgConfig.mode,
      keyIdSet: !!pgConfig.keyId,
      keySecretSet: !!pgConfig.keySecret,
      webhookSecretSet: !!pgConfig.webhookSecret,
    },
  })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  if (body.subsEnabled) {
    const prices = [body.monthlyPrice, body.quarterlyPrice, body.annualPrice]
    const hasPrice = prices.some(p => typeof p === "number" && p > 0)
    if (!hasPrice) {
      return NextResponse.json({ error: "Add at least one subscription price before enabling subscriptions." }, { status: 400 })
    }

    const pgConfig = await getOrCreatePgConfig(session.publisherId)
    if (pgConfig.mode === "own" && (!pgConfig.keyId || !pgConfig.keySecret)) {
      return NextResponse.json({
        error: "Connect your Razorpay Key ID and Key Secret before enabling reader subscriptions.",
        needsPaymentGateway: true,
      }, { status: 422 })
    }
  }

  await upsertPublisherReaderPlan(session.publisherId, body)
  const plan = body.subsEnabled
    ? await syncPublisherReaderSubscriptionPlans(session.publisherId)
    : await getPublisherReaderPlan(session.publisherId)

  const pgConfig = await getOrCreatePgConfig(session.publisherId)
  return NextResponse.json({ plan, syncStatus: getReaderPlanSyncStatus(plan, pgConfig.mode) })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { urlPattern, price, label } = body

  if (!urlPattern || price == null) {
    return NextResponse.json({ error: "urlPattern and price are required" }, { status: 400 })
  }

  const contentPrice = await addContentPrice(session.publisherId, { urlPattern, price, label })
  return NextResponse.json({ contentPrice }, { status: 201 })
}
