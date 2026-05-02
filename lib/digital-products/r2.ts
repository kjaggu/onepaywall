import { createHmac, createHash } from "crypto"

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest()
}

// Generates a standard AWS Signature V4 presigned GET URL for an R2 object.
// R2 is S3-compatible so the same signing algorithm applies.
export function createPresignedGetUrl(r2Key: string, expiresInSeconds = 3600): string {
  const accountId = process.env.R2_ACCOUNT_ID!
  const bucket    = process.env.R2_BUCKET!
  const accessKey = process.env.R2_ACCESS_KEY_ID!
  const secretKey = process.env.R2_SECRET_ACCESS_KEY!

  if (!accountId || !bucket || !accessKey || !secretKey) {
    throw new Error("R2 storage not configured")
  }

  const now        = new Date()
  const dateStr    = now.toISOString().slice(0, 10).replace(/-/g, "")
  const dateTimeStr = now.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z"
  const region     = "auto"
  const service    = "s3"
  const scope      = `${dateStr}/${region}/${service}/aws4_request`
  const host       = `${accountId}.r2.cloudflarestorage.com`
  const path       = `/${bucket}/${r2Key}`

  // Query params must be sorted lexicographically
  const queryParts: [string, string][] = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${accessKey}/${scope}`],
    ["X-Amz-Date", dateTimeStr],
    ["X-Amz-Expires", String(expiresInSeconds)],
    ["X-Amz-SignedHeaders", "host"],
  ]
  queryParts.sort((a, b) => a[0] < b[0] ? -1 : 1)
  const canonicalQuery = queryParts
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&")

  const canonicalRequest = [
    "GET",
    path,
    canonicalQuery,
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n")

  const requestHash = createHash("sha256").update(canonicalRequest).digest("hex")
  const stringToSign = ["AWS4-HMAC-SHA256", dateTimeStr, scope, requestHash].join("\n")

  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${secretKey}`, dateStr), region), service),
    "aws4_request",
  )
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex")

  return `https://${host}${path}?${canonicalQuery}&X-Amz-Signature=${signature}`
}
