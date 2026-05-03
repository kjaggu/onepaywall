import { NextRequest, NextResponse } from "next/server"
import { createHmac, createHash } from "crypto"
import { getSession } from "@/lib/auth/session"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.publisherId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { filename, contentType } = await req.json()

  if (!filename || !contentType) {
    return NextResponse.json({ error: "filename and contentType required" }, { status: 400 })
  }

  const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "video/mp4", "video/webm", "video/ogg",
  ])
  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 })
  }

  // Strip path separators and control characters from the filename
  const safeFilename = filename.replace(/[^\w.\-]/g, "_")

  const accountId = process.env.R2_ACCOUNT_ID
  const bucket    = process.env.R2_BUCKET
  const accessKey = process.env.R2_ACCESS_KEY_ID
  const secretKey = process.env.R2_SECRET_ACCESS_KEY
  const CDN_BASE  = process.env.R2_CDN_BASE_URL

  if (!accountId || !bucket || !accessKey || !secretKey) {
    return NextResponse.json({ error: "R2 storage not configured" }, { status: 503 })
  }

  const storageKey = `ads/${session.publisherId}/${Date.now()}-${safeFilename}`
  const cdnUrl     = CDN_BASE ? `${CDN_BASE}/${storageKey}` : null
  const host       = `${accountId}.r2.cloudflarestorage.com`
  const now        = new Date()
  const dateStr    = now.toISOString().slice(0, 10).replace(/-/g, "")
  const dateTimeStr = now.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z"
  const region     = "auto"
  const service    = "s3"
  const scope      = `${dateStr}/${region}/${service}/aws4_request`
  const expires    = 900

  function hmac(key: Buffer | string, data: string): Buffer {
    return createHmac("sha256", key).update(data).digest()
  }

  const queryParts: [string, string][] = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${accessKey}/${scope}`],
    ["X-Amz-Date", dateTimeStr],
    ["X-Amz-Expires", String(expires)],
    ["X-Amz-SignedHeaders", "content-type;host"],
  ]
  queryParts.sort((a, b) => a[0] < b[0] ? -1 : 1)
  const canonicalQuery = queryParts
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&")

  const canonicalRequest = [
    "PUT",
    `/${bucket}/${storageKey}`,
    canonicalQuery,
    `content-type:${contentType}\nhost:${host}\n`,
    "content-type;host",
    "UNSIGNED-PAYLOAD",
  ].join("\n")

  const requestHash  = createHash("sha256").update(canonicalRequest).digest("hex")
  const stringToSign = ["AWS4-HMAC-SHA256", dateTimeStr, scope, requestHash].join("\n")
  const signingKey   = hmac(hmac(hmac(hmac(`AWS4${secretKey}`, dateStr), region), service), "aws4_request")
  const signature    = createHmac("sha256", signingKey).update(stringToSign).digest("hex")

  const uploadUrl = `https://${host}/${bucket}/${storageKey}?${canonicalQuery}&X-Amz-Signature=${signature}`

  return NextResponse.json({ uploadUrl, storageKey, cdnUrl, expiresIn: expires })
}
