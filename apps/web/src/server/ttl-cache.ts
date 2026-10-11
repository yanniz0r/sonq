// A small in-memory cache for async lookups. Concurrent requests for the
// same key share one in-flight promise, failures are never cached, and the
// oldest entry is evicted once `maxEntries` is reached (Map keeps insertion
// order). Deezer allows ~50 requests per 5 s for the whole server, so every
// call to it goes through one of these.
export interface TtlCache<TValue> {
  get: (key: string, load: () => Promise<TValue>) => Promise<TValue>
}

interface Entry<TValue> {
  value: Promise<TValue>
  expiresAt: number
}

export function createTtlCache<TValue>({
  ttlMs,
  maxEntries = 500,
  now = Date.now,
}: {
  ttlMs: number
  maxEntries?: number
  now?: () => number
}): TtlCache<TValue> {
  const entries = new Map<string, Entry<TValue>>()

  return {
    get(key, load) {
      const hit = entries.get(key)
      if (hit && hit.expiresAt > now()) return hit.value
      entries.delete(key)

      const value = load()
      entries.set(key, { value, expiresAt: now() + ttlMs })
      value.catch(() => {
        if (entries.get(key)?.value === value) entries.delete(key)
      })

      const oldest = entries.keys().next()
      if (entries.size > maxEntries && !oldest.done)
        entries.delete(oldest.value)
      return value
    },
  }
}
