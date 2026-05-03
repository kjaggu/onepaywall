import { NextRequest, NextResponse } from "next/server"
import { createResetToken } from "@/lib/auth/reset-tokens"
import { sendPasswordResetEmail } from "@/lib/auth/email"
import { rateLimit } from "@/lib/auth/rate-limit"

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
  const rl = rateLimit(`forgot-password:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } },
    )
  }

  const { email } = await req.json()
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 })
  }

  // Always return success to prevent email enumeration
  const token = await createResetToken(email.toLowerCase().trim())
  if (token) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"
    const resetUrl = `${appUrl}/reset-password?token=${token}`
    await sendPasswordResetEmail(email, resetUrl)
  }

  return NextResponse.json({ ok: true })
}
