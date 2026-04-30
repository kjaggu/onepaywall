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
import { getDefaultBrand, getBrand } from "@/lib/db/queries/brands"

async function resolveBrandId(publisherId: string, req: NextRequest): Promise<string | null> {
  const brandId = req.nextUrl.searchParams.get("brandId")
  if (brandId) {
    const brand = await getBrand(brandId, publisherId)
    return brand?.id ?? null
  }
  const brand = await getDefaultBrand(publisherId)
  return brand?.id ?? null
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const brandId = await resolveBrandId(session.publisherId, req)
  if (!brandId) return NextResponse.json({ error: "No brand found" }, { status: 404 })

  const [plan, contentPrices, pgConfig] = await Promise.all([
    getPublisherReaderPlan(brandId),
    listContentPrices(session.publisherId),
    getOrCreatePgConfig(brandId, session.publisherId),
  ])

  return NextResponse.json({
    brandId,
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

  const brandId = await resolveBrandId(session.publisherId, req)
  if (!brandId) return NextResponse.json({ error: "No brand found" }, { status: 404 })

  const body = await req.json()
  if (body.subsEnabled) {
    const prices = [body.monthlyPrice, body.quarterlyPrice, body.annualPrice]
    const hasPrice = prices.some(p => typeof p === "number" && p > 0)
    if (!hasPrice) {
      return NextResponse.json({ error: "Add at least one subscription price before enabling subscriptions." }, { status: 400 })
    }

    const pgConfig = await getOrCreatePgConfig(brandId, session.publisherId)
    if (pgConfig.mode === "own" && (!pgConfig.keyId || !pgConfig.keySecret)) {
      return NextResponse.json({
        error: "Connect your Razorpay Key ID and Key Secret before enabling reader subscriptions.",
        needsPaymentGateway: true,
      }, { status: 422 })
    }
  }

  await upsertPublisherReaderPlan(brandId, session.publisherId, body)
  const plan = body.subsEnabled
    ? await syncPublisherReaderSubscriptionPlans(brandId, session.publisherId)
    : await getPublisherReaderPlan(brandId)

  const pgConfig = await getOrCreatePgConfig(brandId, session.publisherId)
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
