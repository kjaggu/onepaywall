import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getPublisherById, updatePublisher } from "@/lib/db/queries/publishers"

export async function GET() {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const publisher = await getPublisherById(session.publisherId)
  if (!publisher) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ publisher })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const allowed = ["name", "currency", "timezone"]
  const data = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const publisher = await updatePublisher(session.publisherId, data)
  return NextResponse.json({ publisher })
}
