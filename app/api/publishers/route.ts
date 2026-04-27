import { NextRequest, NextResponse } from "next/server"
import { getSession, signSession, setSessionCookie } from "@/lib/auth/session"
import { getPublisherById, createPublisher } from "@/lib/db/queries/publishers"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ publisher: null })

  const publisher = await getPublisherById(session.publisherId)
  return NextResponse.json({ publisher })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (session.role !== "publisher") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (session.publisherId) return NextResponse.json({ error: "Publisher already exists" }, { status: 409 })

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  const publisher = await createPublisher({ name: name.trim(), userId: session.sub })

  // Re-issue session with publisherId
  const token = await signSession({ ...session, publisherId: publisher.id })
  await setSessionCookie(token)

  return NextResponse.json({ publisher }, { status: 201 })
}
