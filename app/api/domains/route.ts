import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listDomains, createDomain } from "@/lib/db/queries/domains"

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

  try {
    const created = await createDomain({ publisherId: session.publisherId, name: name.trim(), domain: normalised })
    return NextResponse.json({ domain: created }, { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("domains_domain_idx")) {
      return NextResponse.json({ error: "Domain is already registered" }, { status: 409 })
    }
    throw e
  }
}
