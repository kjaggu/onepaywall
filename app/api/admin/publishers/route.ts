import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listAllPublishers } from "@/lib/db/queries/admin"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (session.role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const publishers = await listAllPublishers()
  return NextResponse.json({ publishers })
}
