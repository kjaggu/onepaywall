import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth/session"

const DASHBOARD_PATHS = ["/overview", "/domains", "/gates", "/revenue", "/audience", "/analytics", "/settings"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const token = req.cookies.get("session")?.value ?? null
  const session = token ? await verifySession(token) : null

  const isAdminPath     = pathname === "/admin" || pathname.startsWith("/admin/")
  const isDashboardPath = DASHBOARD_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))
  const isAuthPath      = ["/login", "/forgot-password", "/reset-password"].some(p => pathname.startsWith(p))

  // Redirect logged-in users away from auth pages
  if (isAuthPath && session) {
    const dest = session.role === "superadmin" ? "/admin" : "/overview"
    return NextResponse.redirect(new URL(dest, req.url))
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
  ],
}
