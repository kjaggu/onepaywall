import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { rateLimit } from "./rate-limit.ts"

describe("rateLimit", () => {
  it("allows requests within the limit", () => {
    const key = `test-allow-${Date.now()}`
    const r1 = rateLimit(key, 3, 60_000)
    const r2 = rateLimit(key, 3, 60_000)
    const r3 = rateLimit(key, 3, 60_000)
    assert.equal(r1.allowed, true)
    assert.equal(r2.allowed, true)
    assert.equal(r3.allowed, true)
  })

  it("blocks the (limit+1)th request", () => {
    const key = `test-block-${Date.now()}`
    rateLimit(key, 2, 60_000)
    rateLimit(key, 2, 60_000)
    const r3 = rateLimit(key, 2, 60_000)
    assert.equal(r3.allowed, false)
    assert.ok((r3.retryAfterMs ?? 0) > 0)
  })

  it("uses separate buckets per key", () => {
    const ts = Date.now()
    rateLimit(`bucket-a-${ts}`, 1, 60_000)
    const rb = rateLimit(`bucket-b-${ts}`, 1, 60_000)
    assert.equal(rb.allowed, true, "different keys should not share counts")
  })

  it("returns retryAfterMs only when blocked", () => {
    const key = `test-retry-${Date.now()}`
    const ok = rateLimit(key, 1, 60_000)
    assert.equal(ok.allowed, true)
    assert.equal(ok.retryAfterMs, undefined)

    const blocked = rateLimit(key, 1, 60_000)
    assert.equal(blocked.allowed, false)
    assert.ok(typeof blocked.retryAfterMs === "number")
  })
})
