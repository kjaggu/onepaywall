import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { isEmailVerified, createVerificationToken } from "@/lib/auth/email-verification"
import { sendVerificationEmail } from "@/lib/auth/email"
import { rateLimit } from "@/lib/auth/rate-limit"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Already verified — nothing to do
  if (await isEmailVerified(session.sub)) {
    return NextResponse.json({ error: "Email already verified" }, { status: 400 })
  }

  // 3 resends per hour per user
  const rl = rateLimit(`resend-verification:${session.sub}`, 3, 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before requesting another link." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } },
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"
  const vToken = await createVerificationToken(session.sub)
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${vToken}`

  await sendVerificationEmail(session.email, verifyUrl)

  return NextResponse.json({ ok: true })
}
