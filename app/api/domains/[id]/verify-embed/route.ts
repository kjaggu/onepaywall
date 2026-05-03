import { NextRequest, NextResponse } from "next/server"
import { promises as dns } from "dns"
import { getSession } from "@/lib/auth/session"
import { getDomain, updateDomain } from "@/lib/db/queries/domains"

type Params = { params: Promise<{ id: string }> }

// Returns true if the IP is in a private/reserved range (SSRF guard).
function isPrivateIp(ip: string): boolean {
  // IPv4 private/loopback/link-local/CGNAT ranges
  const ipv4Private = [
    /^127\./,                          // loopback
    /^10\./,                           // RFC 1918
    /^172\.(1[6-9]|2\d|3[01])\./,     // RFC 1918
    /^192\.168\./,                     // RFC 1918
    /^169\.254\./,                     // link-local (AWS metadata etc.)
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,  // CGNAT
    /^0\./,                            // "this" network
    /^(::1|::ffff:127\.)/, // IPv6 loopback
  ]
  return ipv4Private.some(re => re.test(ip))
}

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

  // SSRF guard: resolve the domain and reject private IP ranges before fetching
  try {
    const { address } = await dns.lookup(domain.domain)
    if (isPrivateIp(address)) {
      return NextResponse.json({ verified: false, reason: "Domain resolves to a private address." })
    }
  } catch {
    return NextResponse.json({
      verified: false,
      reason: "Could not resolve your domain. Make sure it is publicly accessible.",
    })
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
