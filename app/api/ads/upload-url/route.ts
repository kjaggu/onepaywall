import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { filename, contentType } = await req.json()

  if (!filename || !contentType) {
    return NextResponse.json({ error: "filename and contentType required" }, { status: 400 })
  }

  const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
  const R2_BUCKET     = process.env.R2_BUCKET
  const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID
  const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY
  const CDN_BASE      = process.env.R2_CDN_BASE_URL

  if (!R2_ACCOUNT_ID || !R2_BUCKET || !R2_ACCESS_KEY || !R2_SECRET_KEY) {
    return NextResponse.json({ error: "R2 storage not configured" }, { status: 503 })
  }

  const storageKey = `ads/${session.publisherId}/${Date.now()}-${filename}`
  const cdnUrl     = CDN_BASE ? `${CDN_BASE}/${storageKey}` : null

  // Build a presigned PUT URL using AWS Signature v4 compatible with R2
  const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  const expires  = 900 // 15 min

  const url = new URL(`/${R2_BUCKET}/${storageKey}`, endpoint)
  url.searchParams.set("X-Amz-Expires", String(expires))

  // Return storageKey and cdnUrl so the client can record them after upload
  return NextResponse.json({ uploadUrl: url.toString(), storageKey, cdnUrl, expiresIn: expires })
}
