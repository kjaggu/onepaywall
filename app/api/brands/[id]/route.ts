import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getBrand, updateBrand } from "@/lib/db/queries/brands"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const patch: { name?: string } = {}
  if (body.name?.trim()) patch.name = body.name.trim()

  const updated = await updateBrand(id, session.publisherId, patch)
  if (!updated) return NextResponse.json({ error: "Brand not found" }, { status: 404 })

  return NextResponse.json({ brand: updated })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const brand = await getBrand(id, session.publisherId)
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 })

  return NextResponse.json({ brand })
}
