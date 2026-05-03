// Simple sliding-window rate limiter backed by an in-memory Map.
// Works for single-process deployments. For multi-instance / serverless
// environments with many concurrent requests, migrate the store to Redis
// (e.g. @upstash/ratelimit) so limits are enforced across all instances.

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

// Purge expired entries every 10 minutes to prevent unbounded growth.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, win] of store) {
      if (win.resetAt < now) store.delete(key)
    }
  }, 10 * 60 * 1000)
}

/**
 * Check whether `key` is within `limit` requests per `windowMs` milliseconds.
 * Returns `{ allowed: true }` or `{ allowed: false, retryAfterMs }`.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || existing.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (existing.count >= limit) {
    return { allowed: false, retryAfterMs: existing.resetAt - now }
  }

  existing.count++
  return { allowed: true }
}
