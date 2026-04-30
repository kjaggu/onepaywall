import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { createManualSubscription } from "@/lib/db/queries/reader-subscriptions"
import { getBrand, getDefaultBrand } from "@/lib/db/queries/brands"

const VALID_INTERVALS = ["monthly", "quarterly", "annual", "lifetime"] as const

type ImportRow = {
  email: string
  interval: string
  expiresAt?: string
  paymentMethod?: string
  notes?: string
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { rows, brandId: brandIdParam } = body as { rows: ImportRow[]; brandId?: string }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows must be a non-empty array" }, { status: 400 })
  }

  const brand = brandIdParam
    ? await getBrand(brandIdParam, session.publisherId)
    : await getDefaultBrand(session.publisherId)

  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 })

  let imported = 0
  let skipped = 0
  const errors: Array<{ email: string; reason: string }> = []

  // Process in batches of 5 concurrently
  for (let i = 0; i < rows.length; i += 5) {
    const batch = rows.slice(i, i + 5)
    await Promise.all(
      batch.map(async (row) => {
        const email = typeof row.email === "string" ? row.email.trim() : ""
        if (!email || !email.includes("@")) {
          errors.push({ email: email || "(empty)", reason: "Invalid email" })
          return
        }
        if (!row.interval || !VALID_INTERVALS.includes(row.interval as typeof VALID_INTERVALS[number])) {
          errors.push({ email, reason: `Invalid interval: ${row.interval}` })
          return
        }
        try {
          const result = await createManualSubscription({
            publisherId: session.publisherId!,
            brandId: brand.id,
            email,
            interval: row.interval,
            expiresAt: row.expiresAt ? new Date(row.expiresAt) : null,
            paymentMethod: row.paymentMethod ?? null,
            notes: row.notes ?? null,
          })
          if (result.alreadyActive) {
            skipped++
          } else {
            imported++
          }
        } catch (err) {
          errors.push({ email, reason: err instanceof Error ? err.message : "Unknown error" })
        }
      }),
    )
  }

  return NextResponse.json({ imported, skipped, errors })
}
