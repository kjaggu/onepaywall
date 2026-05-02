import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listAdNetworks, upsertAdNetwork } from "@/lib/db/queries/ad-networks"
import type { AdProvider, AdsenseCredentials, GAMCredentials } from "@/lib/db/queries/ad-networks"

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

  const provider = body.provider as AdProvider
  if (provider !== "google_adsense" && provider !== "google_ad_manager") {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 })
  }

  let credentials: AdsenseCredentials | GAMCredentials
  if (provider === "google_adsense") {
    if (!body.credentials.adClientId) {
      return NextResponse.json({ error: "adClientId is required for AdSense" }, { status: 400 })
    }
    credentials = { adClientId: body.credentials.adClientId }
  } else {
    if (!body.credentials.networkCode || !body.credentials.adUnitRootPath) {
      return NextResponse.json({ error: "networkCode and adUnitRootPath are required for GAM" }, { status: 400 })
    }
    credentials = { networkCode: body.credentials.networkCode, adUnitRootPath: body.credentials.adUnitRootPath }
  }

  const network = await upsertAdNetwork(session.publisherId, provider, credentials, true)
  return NextResponse.json({ network }, { status: 201 })
}
