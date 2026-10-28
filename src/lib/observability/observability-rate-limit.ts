type RateLimitBucket = {
  count: number
  startedAt: number
}

type SlidingWindowRateLimiterOptions = {
  limit: number
  maxKeys: number
  windowMs: number
}

export function createSlidingWindowRateLimiter({
  limit,
  maxKeys,
  windowMs,
}: SlidingWindowRateLimiterOptions) {
  const buckets = new Map<string, RateLimitBucket>()

  return function allow(key: string, now = Date.now()) {
    const normalizedKey = key.trim() || 'anonymous'
    const current = buckets.get(normalizedKey)

    if (current && now - current.startedAt < windowMs) {
      if (current.count >= limit) {
        return false
      }

      current.count += 1
      return true
    }

    for (const [bucketKey, bucket] of buckets) {
      if (now - bucket.startedAt >= windowMs) {
        buckets.delete(bucketKey)
      }
    }

    if (!current && buckets.size >= maxKeys) {
      const oldestKey = buckets.keys().next().value

      if (typeof oldestKey === 'string') {
        buckets.delete(oldestKey)
      }
    }

    buckets.set(normalizedKey, { count: 1, startedAt: now })
    return true
  }
}
