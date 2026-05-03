import { NextRequest, NextResponse } from "next/server"
import { registerPublisher } from "@/lib/auth/register"
import { signSession, setSessionCookie } from "@/lib/auth/session"
import { sendWelcomeEmail, sendVerificationEmail } from "@/lib/auth/email"
import { createVerificationToken } from "@/lib/auth/email-verification"
import { rateLimit } from "@/lib/auth/rate-limit"

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
  const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } },
    )
  }

  const { name, publicationName, email, password } = await req.json()

  if (!name || !publicationName || !email || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })
  }

  const result = await registerPublisher({ name, publicationName, email, password })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const token = await signSession({
    sub: result.userId,
    email: result.email,
    role: "publisher",
    publisherId: result.publisherId,
    emailVerified: false,
  })

  await setSessionCookie(token)

  // Send verification + welcome emails fire-and-forget
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"
  createVerificationToken(result.userId).then(vToken => {
    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${vToken}`
    return Promise.all([
      sendVerificationEmail(result.email, verifyUrl),
      sendWelcomeEmail(result.email, result.name, publicationName),
    ])
  }).catch(() => {})

  return NextResponse.json({ redirectTo: "/verify-email" })
}
