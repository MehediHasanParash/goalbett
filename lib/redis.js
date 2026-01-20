import { Redis } from "ioredis"

let redis = null

export function getRedisClient() {
  if (redis) {
    return redis
  }

  const REDIS_URL = process.env.REDIS_URL || process.env.KV_URL

  if (!REDIS_URL) {
    console.warn("[v0] Redis URL not found. Caching will be disabled.")
    return null
  }

  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })

    redis.on("error", (error) => {
      console.error("[v0] Redis connection error:", error)
    })

    redis.on("connect", () => {
      console.log("[v0] Redis connected successfully")
    })

    return redis
  } catch (error) {
    console.error("[v0] Failed to initialize Redis:", error)
    return null
  }
}

// Cache utility functions
export async function cacheGet(key) {
  const client = getRedisClient()
  if (!client) return null

  try {
    const data = await client.get(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error("[v0] Redis GET error:", error)
    return null
  }
}

export async function cacheSet(key, value, ttlSeconds = 3600) {
  const client = getRedisClient()
  if (!client) return false

  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value))
    return true
  } catch (error) {
    console.error("[v0] Redis SET error:", error)
    return false
  }
}

export async function cacheDel(key) {
  const client = getRedisClient()
  if (!client) return false

  try {
    await client.del(key)
    return true
  } catch (error) {
    console.error("[v0] Redis DEL error:", error)
    return false
  }
}

export async function cacheFlushPattern(pattern) {
  const client = getRedisClient()
  if (!client) return false

  try {
    const keys = await client.keys(pattern)
    if (keys.length > 0) {
      await client.del(...keys)
    }
    return true
  } catch (error) {
    console.error("[v0] Redis FLUSH error:", error)
    return false
  }
}

export default getRedisClient
