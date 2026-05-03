import { NextRequest, NextResponse } from "next/server"
import { consumeVerificationToken } from "@/lib/auth/email-verification"
import { markEmailVerified } from "@/lib/auth/users"
import { getSession, signSession, setSessionCookie } from "@/lib/auth/session"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? ""

  const userId = await consumeVerificationToken(token)
  if (!userId) {
    return NextResponse.redirect(`${APP_URL}/verify-email?error=invalid`)
  }

  await markEmailVerified(userId)

  // Re-issue the session so emailVerified=true is reflected immediately
  const existing = await getSession()
  if (existing && existing.sub === userId) {
    const newToken = await signSession({ ...existing, emailVerified: true })
    await setSessionCookie(newToken)
  }

  return NextResponse.redirect(`${APP_URL}/overview`)
}
