import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getDomain, updateDomain } from "@/lib/db/queries/domains"

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const domain = await getDomain(id, session.publisherId)
  if (!domain) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // If already verified, nothing to do
  if (domain.embedEnabled) {
    return NextResponse.json({ verified: true })
  }

  const url = `https://${domain.domain}`

  let html: string
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "OnePaywall-Verifier/1.0" },
    })
    if (!res.ok) {
      return NextResponse.json({
        verified: false,
        reason: `Your domain returned HTTP ${res.status}. Make sure the site is live and publicly accessible.`,
      })
    }
    html = await res.text()
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError"
    return NextResponse.json({
      verified: false,
      reason: isTimeout
        ? "Request timed out — your domain did not respond within 10 seconds."
        : "Could not reach your domain. Make sure it is publicly accessible.",
    })
  }

  const siteKey = domain.siteKey
  const found =
    html.includes(`data-site-key="${siteKey}"`) ||
    html.includes(`data-site-key='${siteKey}'`)

  if (!found) {
    return NextResponse.json({
      verified: false,
      reason:
        "The embed script was not found on your domain's homepage. Make sure you copied the full snippet and deployed the change.",
    })
  }

  await updateDomain(id, session.publisherId, { embedEnabled: true })
  return NextResponse.json({ verified: true })
}
