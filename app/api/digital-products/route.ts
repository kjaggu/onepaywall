import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listDigitalProducts, createDigitalProduct } from "@/lib/db/queries/digital-products"

export async function GET() {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const products = await listDigitalProducts(session.publisherId)
  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: {
    title?: string
    description?: string | null
    r2Key?: string
    fileName?: string
    mimeType?: string
    priceInPaise?: number
    brandId?: string | null
  }
  try { body = await req.json() } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }) }

  const { title, r2Key, fileName, mimeType, priceInPaise } = body
  if (!title || !r2Key || !fileName || !mimeType || typeof priceInPaise !== "number") {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 })
  }

  const product = await createDigitalProduct({
    publisherId: session.publisherId,
    brandId: body.brandId ?? null,
    title,
    description: body.description ?? null,
    r2Key,
    fileName,
    mimeType,
    priceInPaise,
  })

  return NextResponse.json({ product }, { status: 201 })
}
