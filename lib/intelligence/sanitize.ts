// Query params that may carry PII — stripped before storage
const PII_PARAMS = new Set([
  "email", "token", "access_token", "auth", "api_key", "key", "secret",
  "password", "pass", "session", "sid", "uid", "user_id", "userid",
  "name", "first_name", "last_name", "phone", "mobile",
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "fbclid", "gclid", "msclkid", "twclid", "ref", "referrer",
])

export function sanitizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl)
    // Remove fragment — never meaningful for content identity
    url.hash = ""
    // Strip PII-bearing query params
    for (const key of [...url.searchParams.keys()]) {
      if (PII_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key)
    }
    // Normalise trailing slash on path
    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1)
    }
    return url.toString()
  } catch {
    // Not a valid URL — return as-is, truncated
    return rawUrl.slice(0, 2000)
  }
}

export function extractPath(rawUrl: string): string {
  try {
    return new URL(rawUrl).pathname
  } catch {
    return rawUrl.startsWith("/") ? rawUrl : "/"
  }
}
