import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { createHmac } from "crypto"

// ── SSRF private-IP guard (inlined from verify-embed route) ──────────────────

function isPrivateIp(ip: string): boolean {
  const ipv4Private = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
    /^0\./,
    /^(::1|::ffff:127\.)/,
  ]
  return ipv4Private.some(re => re.test(ip))
}

describe("isPrivateIp", () => {
  it("blocks loopback", () => assert.equal(isPrivateIp("127.0.0.1"), true))
  it("blocks RFC 1918 10.x", () => assert.equal(isPrivateIp("10.0.0.1"), true))
  it("blocks RFC 1918 172.16-31", () => {
    assert.equal(isPrivateIp("172.16.0.1"), true)
    assert.equal(isPrivateIp("172.31.255.255"), true)
    assert.equal(isPrivateIp("172.32.0.1"), false)   // just outside range
  })
  it("blocks RFC 1918 192.168", () => assert.equal(isPrivateIp("192.168.1.1"), true))
  it("blocks link-local (AWS metadata)", () => assert.equal(isPrivateIp("169.254.169.254"), true))
  it("allows public IPs", () => {
    assert.equal(isPrivateIp("8.8.8.8"), false)
    assert.equal(isPrivateIp("1.1.1.1"), false)
    assert.equal(isPrivateIp("93.184.216.34"), false)
  })
})

// ── Open-redirect URL validation ─────────────────────────────────────────────

function isValidRedirectDestination(url: string): boolean {
  let parsed: URL
  try { parsed = new URL(url) } catch { return false }
  return parsed.protocol === "https:"
}

describe("open redirect guard", () => {
  it("allows https URLs", () => {
    assert.equal(isValidRedirectDestination("https://example.com/path"), true)
    assert.equal(isValidRedirectDestination("https://publisher.news/article"), true)
  })
  it("blocks http", () => assert.equal(isValidRedirectDestination("http://example.com"), false))
  it("blocks javascript: scheme", () => assert.equal(isValidRedirectDestination("javascript:alert(1)"), false))
  it("blocks data: scheme", () => assert.equal(isValidRedirectDestination("data:text/html,<h1>XSS</h1>"), false))
  it("blocks bare strings", () => assert.equal(isValidRedirectDestination("attacker.com"), false))
  it("blocks empty string", () => assert.equal(isValidRedirectDestination(""), false))
})

// ── Svix HMAC webhook verification ───────────────────────────────────────────

function verifySvixSignature(
  secret: string,
  svixId: string,
  svixTimestamp: string,
  rawBody: string,
  svixSignature: string,
): boolean {
  const tsMs = Number(svixTimestamp) * 1000
  if (isNaN(tsMs) || Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) return false

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64")
  const toSign = `${svixId}.${svixTimestamp}.${rawBody}`
  const computed = createHmac("sha256", secretBytes).update(toSign).digest("base64")

  return svixSignature.split(" ").some(part => {
    const [version, sig] = part.split(",")
    if (version !== "v1" || !sig) return false
    const a = Buffer.from(computed)
    const b = Buffer.from(sig)
    if (a.length !== b.length) return false
    return a.equals(b) // simplified — production uses timingSafeEqual
  })
}

function makeTestSignature(secret: string, id: string, ts: string, body: string): string {
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64")
  const sig = createHmac("sha256", secretBytes).update(`${id}.${ts}.${body}`).digest("base64")
  return `v1,${sig}`
}

describe("verifySvixSignature", () => {
  const SECRET = "whsec_" + Buffer.from("test-secret-32-bytes-long!!!!!").toString("base64")
  const ID     = "msg_test123"
  const TS     = String(Math.floor(Date.now() / 1000))
  const BODY   = JSON.stringify({ type: "email.bounced", data: { email: "user@example.com" } })

  it("accepts a valid signature", () => {
    const sig = makeTestSignature(SECRET, ID, TS, BODY)
    assert.equal(verifySvixSignature(SECRET, ID, TS, BODY, sig), true)
  })

  it("rejects a tampered body", () => {
    const sig = makeTestSignature(SECRET, ID, TS, BODY)
    assert.equal(verifySvixSignature(SECRET, ID, TS, BODY + "x", sig), false)
  })

  it("rejects a wrong signature", () => {
    assert.equal(verifySvixSignature(SECRET, ID, TS, BODY, "v1,invalidsignature"), false)
  })

  it("rejects an expired timestamp (>5 min)", () => {
    const oldTs = String(Math.floor(Date.now() / 1000) - 400)
    const sig = makeTestSignature(SECRET, ID, oldTs, BODY)
    assert.equal(verifySvixSignature(SECRET, ID, oldTs, BODY, sig), false)
  })

  it("rejects a non-v1 version prefix", () => {
    const sig = makeTestSignature(SECRET, ID, TS, BODY).replace("v1,", "v2,")
    assert.equal(verifySvixSignature(SECRET, ID, TS, BODY, sig), false)
  })

  it("accepts when signature is in a space-separated list", () => {
    const sig = makeTestSignature(SECRET, ID, TS, BODY)
    const multiSig = `v1,wrongsig ${sig}`
    assert.equal(verifySvixSignature(SECRET, ID, TS, BODY, multiSig), true)
  })
})

// ── MIME type whitelist ───────────────────────────────────────────────────────

const AD_ALLOWED = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "video/mp4", "video/webm", "video/ogg",
])

const DIGITAL_ALLOWED = new Set([
  "application/pdf",
  "application/zip", "application/x-zip-compressed",
  "application/epub+zip",
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "video/mp4", "video/webm",
  "audio/mpeg", "audio/mp4", "audio/ogg",
  "text/plain", "text/csv",
])

describe("MIME type whitelist — ads", () => {
  it("allows valid image types", () => assert.equal(AD_ALLOWED.has("image/jpeg"), true))
  it("allows valid video types", () => assert.equal(AD_ALLOWED.has("video/mp4"), true))
  it("blocks text/html", () => assert.equal(AD_ALLOWED.has("text/html"), false))
  it("blocks application/x-executable", () => assert.equal(AD_ALLOWED.has("application/x-executable"), false))
  it("blocks image/svg+xml", () => assert.equal(AD_ALLOWED.has("image/svg+xml"), false))
  it("blocks text/javascript", () => assert.equal(AD_ALLOWED.has("text/javascript"), false))
})

describe("MIME type whitelist — digital products", () => {
  it("allows PDF", () => assert.equal(DIGITAL_ALLOWED.has("application/pdf"), true))
  it("allows audio", () => assert.equal(DIGITAL_ALLOWED.has("audio/mpeg"), true))
  it("blocks text/html", () => assert.equal(DIGITAL_ALLOWED.has("text/html"), false))
  it("blocks application/x-sh", () => assert.equal(DIGITAL_ALLOWED.has("application/x-sh"), false))
})
