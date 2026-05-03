import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { consumeResetToken } from "@/lib/auth/reset-tokens"
import { getUserByEmail, updatePasswordHash } from "@/lib/auth/users"

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required." }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })
  }

  const email = await consumeResetToken(token)
  if (!email) {
    return NextResponse.json({ error: "This reset link has expired or is invalid." }, { status: 400 })
  }

  const user = await getUserByEmail(email)
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  const hash = await bcrypt.hash(password, 12)
  await updatePasswordHash(user.id, hash)

  return NextResponse.json({ ok: true })
}
