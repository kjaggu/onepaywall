import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { deleteContentPrice } from "@/lib/db/queries/publisher-plans"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await deleteContentPrice(id, session.publisherId)
  return NextResponse.json({ ok: true })
}
