import { NextRequest, NextResponse } from "next/server"
import { createResetToken } from "@/lib/auth/reset-tokens"
import { sendPasswordResetEmail } from "@/lib/auth/email"

export async function POST(req: NextRequest) {
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
