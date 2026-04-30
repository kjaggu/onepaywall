import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listDomains, createDomain, countActiveDomains, getDomainOwnerByHost } from "@/lib/db/queries/domains"
import { getPublisherLimits } from "@/lib/db/queries/billing"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ domains: [] })

  const domains = await listDomains(session.publisherId)
  return NextResponse.json({ domains })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ error: "No publisher found" }, { status: 403 })

  const { name, domain } = await req.json()
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

  // Plan-limit check. NULL maxDomains means unlimited (Scale tier).
  const limits = await getPublisherLimits(session.publisherId)
  if (limits?.maxDomains != null) {
    const current = await countActiveDomains(session.publisherId)
    if (current >= limits.maxDomains) {
      return NextResponse.json({
        error: `Your ${limits.planName} plan allows ${limits.maxDomains} domain${limits.maxDomains === 1 ? "" : "s"}. Upgrade to add more.`,
        upgrade: true,
      }, { status: 422 })
    }
  }

  try {
    const created = await createDomain({ publisherId: session.publisherId, name: name.trim(), domain: normalised })
    return NextResponse.json({ domain: created }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("domains_domain_idx")) {
      return NextResponse.json({ error: "This domain is already linked to a publisher." }, { status: 409 })
    }
    throw e
  }
}
