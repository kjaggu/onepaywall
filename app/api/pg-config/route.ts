import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getOrCreatePgConfig, updatePgConfig } from "@/lib/db/queries/pg-configs"
import { getDefaultBrand, getBrand } from "@/lib/db/queries/brands"

async function resolveBrandId(publisherId: string, req: NextRequest): Promise<string | null> {
  const brandId = req.nextUrl.searchParams.get("brandId")
  if (brandId) {
    const brand = await getBrand(brandId, publisherId)
    return brand?.id ?? null
  }
  const brand = await getDefaultBrand(publisherId)
  return brand?.id ?? null
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const brandId = await resolveBrandId(session.publisherId, req)
  if (!brandId) return NextResponse.json({ error: "No brand found" }, { status: 404 })

  const config = await getOrCreatePgConfig(brandId, session.publisherId)

  // Never return secrets — only whether they're set
  return NextResponse.json({
    brandId,
    mode: config.mode,
    provider: config.provider,
    keyId: config.keyId ?? "",
    keySecretSet: !!config.keySecret,
    webhookSecretSet: !!config.webhookSecret,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  if (!session.publisherId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const brandId = await resolveBrandId(session.publisherId, req)
  if (!brandId) return NextResponse.json({ error: "No brand found" }, { status: 404 })

  const body = await req.json()
  const patch: Parameters<typeof updatePgConfig>[1] = {}

  if (body.mode === "platform" || body.mode === "own") patch.mode = body.mode
  if (body.keyId !== undefined) patch.keyId = String(body.keyId).trim()
  // Empty string means "clear"; undefined means "don't change"
  if (body.keySecret !== undefined) patch.keySecret = body.keySecret || null
  if (body.webhookSecret !== undefined) patch.webhookSecret = body.webhookSecret || null

  // Must upsert — create row first if it doesn't exist
  await getOrCreatePgConfig(brandId, session.publisherId)
  const updated = await updatePgConfig(brandId, patch)
  if (!updated) return NextResponse.json({ error: "Failed to save" }, { status: 500 })

  return NextResponse.json({
    brandId,
    mode: updated.mode,
    provider: updated.provider,
    keyId: updated.keyId ?? "",
    keySecretSet: !!updated.keySecret,
    webhookSecretSet: !!updated.webhookSecret,
  })
}
