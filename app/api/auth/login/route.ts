import { NextRequest, NextResponse } from "next/server"
import { verifyUser } from "@/lib/auth/users"
import { signSession, setSessionCookie } from "@/lib/auth/session"

export async function POST(req: NextRequest) {
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
  })

  await setSessionCookie(token)

  const redirectTo = user.role === "superadmin" ? "/admin" : "/overview"
  return NextResponse.json({ redirectTo })
}
