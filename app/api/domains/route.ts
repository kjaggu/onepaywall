import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listDomains, createDomain, countActiveDomains, getDomainOwnerByHost } from "@/lib/db/queries/domains"
import { getPublisherLimits } from "@/lib/db/queries/billing"
import { getDefaultBrand, getBrand, countDomainsForBrand } from "@/lib/db/queries/brands"

const MAX_DOMAINS_PER_BRAND = 3

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ domains: [] })

  const brandId = req.nextUrl.searchParams.get("brandId") ?? undefined
  const domains = await listDomains(session.publisherId, brandId)
  return NextResponse.json({ domains })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ error: "No publisher found" }, { status: 403 })

  const { name, domain, brandId: bodyBrandId } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })
  if (!domain?.trim()) return NextResponse.json({ error: "Domain is required" }, { status: 400 })

  const domainPattern = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/i
  const normalised = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "")
  if (!domainPattern.test(normalised)) {
    return NextResponse.json({ error: "Invalid domain format" }, { status: 400 })
  }

  const existingOwner = await getDomainOwnerByHost(normalised)
  if (existingOwner && existingOwner.publisherId !== session.publisherId && !existingOwner.deletedAt) {
    return NextResponse.json({
      error: `This domain is already linked to another publisher (${existingOwner.publisherName}).`,
    }, { status: 409 })
  }

  // Resolve brand — use provided brandId or fall back to default brand
  const brand = bodyBrandId
    ? await getBrand(bodyBrandId, session.publisherId)
    : await getDefaultBrand(session.publisherId)
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 })

  // Per-brand domain cap (always 3)
  const brandDomainCount = await countDomainsForBrand(brand.id)
  if (brandDomainCount >= MAX_DOMAINS_PER_BRAND) {
    return NextResponse.json({
      error: `Each brand can have up to ${MAX_DOMAINS_PER_BRAND} domains. Upgrade or create a new brand.`,
      upgrade: true,
    }, { status: 422 })
  }

  // Publisher plan — max brands check (but domain creation itself is brand-capped above)
  const limits = await getPublisherLimits(session.publisherId)
  if (limits?.maxBrands != null) {
    const current = await countActiveDomains(session.publisherId)
    // Legacy fallback: if maxDomains still used as total
    if (limits.maxDomains != null && current >= limits.maxDomains) {
      return NextResponse.json({
        error: `Your ${limits.planName} plan allows ${limits.maxDomains} domain${limits.maxDomains === 1 ? "" : "s"} total. Upgrade to add more.`,
        upgrade: true,
      }, { status: 422 })
    }
  }

  try {
    const created = await createDomain({ publisherId: session.publisherId, brandId: brand.id, name: name.trim(), domain: normalised })
    return NextResponse.json({ domain: created }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("domains_domain_idx")) {
      return NextResponse.json({ error: "This domain is already linked to a publisher." }, { status: 409 })
    }
    throw e
  }
}
