import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session"

const DASHBOARD_PATHS = ["/overview", "/domains", "/gates", "/revenue", "/audience", "/analytics", "/settings"]

const EMBED_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

const CSRF_SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // CORS for embed API — called cross-origin from publisher sites
  if (pathname.startsWith("/api/embed/")) {
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: EMBED_CORS_HEADERS })
    }
    const res = NextResponse.next()
    Object.entries(EMBED_CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }

  // CSRF guard: verify Origin header on mutating requests to non-embed API routes.
  // Webhook endpoints and email tracking are excluded — they come from third-party servers.
  if (
    pathname.startsWith("/api/") &&
    !CSRF_SAFE_METHODS.has(req.method) &&
    !pathname.startsWith("/api/webhooks/") &&
    !pathname.startsWith("/api/email/webhook") &&
    !pathname.startsWith("/api/email/track/")
  ) {
    const origin = req.headers.get("origin")
    const host   = req.headers.get("host")
    if (origin) {
      try {
        const originHost = new URL(origin).host
        if (originHost !== host) {
          return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          })
        }
      } catch {
        return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        })
      }
    }
  }

  const token = req.cookies.get("session")?.value ?? null
  const session = token ? await verifySession(token) : null

  const isAdminPath     = pathname === "/admin" || pathname.startsWith("/admin/")
  const isDashboardPath = DASHBOARD_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))
  const isAuthPath      = ["/login", "/forgot-password", "/reset-password", "/verify-email"].some(p => pathname.startsWith(p))

  // Redirect logged-in users away from auth pages (except verify-email — they must stay there)
  if (isAuthPath && session && !pathname.startsWith("/verify-email")) {
    if (!session.emailVerified) return NextResponse.redirect(new URL("/verify-email", req.url))
    const dest = session.role === "superadmin" ? "/admin" : "/overview"
    return NextResponse.redirect(new URL(dest, req.url))
  }

  // Block unverified users from the dashboard
  if (isDashboardPath && session && !session.emailVerified) {
    return NextResponse.redirect(new URL("/verify-email", req.url))
  }

  // Protect admin paths
  if (isAdminPath) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url))
    if (session.role !== "superadmin") return NextResponse.redirect(new URL("/overview", req.url))
  }

  // Protect publisher dashboard paths
  if (isDashboardPath && !session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/:path*",
    "/admin/:path*",
    "/overview/:path*", "/overview",
    "/domains/:path*",  "/domains",
    "/gates/:path*",    "/gates",
    "/revenue/:path*",  "/revenue",
    "/audience/:path*", "/audience",
    "/analytics/:path*","/analytics",
    "/settings/:path*", "/settings",
    "/login",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ],
}
