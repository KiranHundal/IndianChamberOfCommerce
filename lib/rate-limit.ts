import { NextRequest } from 'next/server'

interface RateLimitConfig {
  interval: number // ms
  limit: number
}

interface RateLimitEntry {
  count: number
  expiresAt: number
}

export function rateLimit(config: RateLimitConfig) {
  const { interval, limit } = config
  const tokenMap = new Map<string, RateLimitEntry>()

  // Clean up expired entries periodically to prevent memory leaks
  setInterval(() => {
    const now = Date.now()
    tokenMap.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        tokenMap.delete(key)
      }
    })
  }, interval).unref?.()

  return function check(req: NextRequest): { success: boolean; remaining: number } {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'

    const now = Date.now()
    const entry = tokenMap.get(ip)

    if (!entry || now > entry.expiresAt) {
      tokenMap.set(ip, { count: 1, expiresAt: now + interval })
      return { success: true, remaining: limit - 1 }
    }

    entry.count++

    if (entry.count > limit) {
      return { success: false, remaining: 0 }
    }

    return { success: true, remaining: limit - entry.count }
  }
}
