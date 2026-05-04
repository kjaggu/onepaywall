import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import {
  listBrands,
  createBrand,
  countBrandsForPublisher,
  getBrandBySlug,
  getBrandsSummary,
} from "@/lib/db/queries/brands"
import { getPublisherLimits } from "@/lib/db/queries/billing"
import { slugify } from "@/lib/utils"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const summary = req.nextUrl.searchParams.get("summary") === "1"
  if (summary) {
    const brands = await getBrandsSummary(session.publisherId)
    return NextResponse.json({ brands })
  }

  const brands = await listBrands(session.publisherId)
  return NextResponse.json({ brands })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Brand name is required" }, { status: 400 })

  const limits = await getPublisherLimits(session.publisherId)
  if (limits?.maxBrands != null) {
    const current = await countBrandsForPublisher(session.publisherId)
    if (current >= limits.maxBrands) {
      return NextResponse.json({
        error: `Your ${limits.planName} plan allows ${limits.maxBrands} brand${limits.maxBrands === 1 ? "" : "s"}. Upgrade to add more.`,
        upgrade: true,
      }, { status: 422 })
    }
  }

  const baseSlug = slugify(name.trim())
  let slug = baseSlug
  let attempt = 1
  while (await getBrandBySlug(session.publisherId, slug)) {
    slug = `${baseSlug}-${++attempt}`
  }

  const brand = await createBrand(session.publisherId, { name: name.trim(), slug })
  return NextResponse.json({ brand }, { status: 201 })
}
