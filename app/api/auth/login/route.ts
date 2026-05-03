import { NextRequest, NextResponse } from "next/server"
import { verifyUser } from "@/lib/auth/users"
import { signSession, setSessionCookie } from "@/lib/auth/session"
import { rateLimit } from "@/lib/auth/rate-limit"

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
  const rl = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } },
    )
  }

  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 })
  }

  const user = await verifyUser(email, password)
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
  }

  const token = await signSession({
    sub: user.id,
    email: user.email,
    role: user.role,
    publisherId: user.publisherId,
    emailVerified: user.emailVerified,
  })

  await setSessionCookie(token)

  if (!user.emailVerified) {
    return NextResponse.json({ redirectTo: "/verify-email" })
  }

  const redirectTo = user.role === "superadmin" ? "/admin" : "/overview"
  return NextResponse.json({ redirectTo })
}
