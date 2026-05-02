import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listAdNetworks, upsertAdNetwork } from "@/lib/db/queries/ad-networks"
import type { AdsenseCredentials } from "@/lib/db/queries/ad-networks"

export async function GET() {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const networks = await listAdNetworks(session.publisherId)
  return NextResponse.json({ networks })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.provider || !body?.credentials) {
    return NextResponse.json({ error: "provider and credentials are required" }, { status: 400 })
  }

  if (body.provider !== "google_adsense") {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 })
  }

  if (!body.credentials.adClientId) {
    return NextResponse.json({ error: "adClientId is required" }, { status: 400 })
  }

  const credentials: AdsenseCredentials = { adClientId: body.credentials.adClientId }
  const network = await upsertAdNetwork(session.publisherId, "google_adsense", credentials, true)
  return NextResponse.json({ network }, { status: 201 })
}
