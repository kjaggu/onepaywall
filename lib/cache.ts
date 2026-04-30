type Entry<V> = { v: V; exp: number }

export type TTLCache<K extends string, V> = {
  get(key: K): V | undefined
  set(key: K, value: V, ttlMs: number): void
  del(key: K): void
}

// Module-level in-process cache. On Vercel, warm function instances reuse the
// same module, so this persists across requests — effectively a free per-instance
// cache with no external dependency. Cold starts begin with an empty cache and
// fill on the first request.
export function makeCache<K extends string, V>(): TTLCache<K, V> {
  const store = new Map<K, Entry<V>>()
  return {
    get(key) {
      const e = store.get(key)
      if (!e) return undefined
      if (Date.now() > e.exp) { store.delete(key); return undefined }
      return e.v
    },
    set(key, value, ttlMs) {
      store.set(key, { v: value, exp: Date.now() + ttlMs })
    },
    del(key) {
      store.delete(key)
    },
  }
}
