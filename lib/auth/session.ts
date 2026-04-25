import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const COOKIE_NAME = "session"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export type SessionPayload = {
  sub: string
  email: string
  role: "superadmin" | "publisher"
  publisherId?: string
}

function secret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error("JWT_SECRET not set")
  return new TextEncoder().encode(s)
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret())
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySession(token)
}

export async function setSessionCookie(token: string) {
  const jar = await cookies()
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  })
}

export async function clearSessionCookie() {
  const jar = await cookies()
  jar.delete(COOKIE_NAME)
}
