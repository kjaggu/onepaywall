import { NextRequest, NextResponse } from "next/server"
import { registerPublisher } from "@/lib/auth/register"
import { signSession, setSessionCookie } from "@/lib/auth/session"
import { sendWelcomeEmail } from "@/lib/auth/email"

export async function POST(req: NextRequest) {
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
  })

  await setSessionCookie(token)

  // fire-and-forget — don't block the redirect on email delivery
  sendWelcomeEmail(result.email, result.name, publicationName).catch(() => {})

  return NextResponse.json({ redirectTo: "/overview" })
}
