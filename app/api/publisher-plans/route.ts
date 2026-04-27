import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getPublisherReaderPlan, upsertPublisherReaderPlan, listContentPrices, addContentPrice, deleteContentPrice } from "@/lib/db/queries/publisher-plans"

export async function GET() {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [plan, contentPrices] = await Promise.all([
    getPublisherReaderPlan(session.publisherId),
    listContentPrices(session.publisherId),
  ])

  return NextResponse.json({ plan, contentPrices })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const plan = await upsertPublisherReaderPlan(session.publisherId, body)
  return NextResponse.json({ plan })
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
