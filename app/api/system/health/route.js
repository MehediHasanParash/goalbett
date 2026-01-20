import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { getRedisClient } from "@/lib/redis"

export async function GET(request) {
  const startTime = Date.now()
  const services = []

  // Check MongoDB
  try {
    const mongoStart = Date.now()
    await dbConnect()
    const mongoLatency = Date.now() - mongoStart
    services.push({
      name: "MongoDB Database",
      status: "healthy",
      latency: `${mongoLatency}ms`,
      lastCheck: new Date().toISOString(),
    })
  } catch (error) {
    services.push({
      name: "MongoDB Database",
      status: "critical",
      latency: "N/A",
      lastCheck: new Date().toISOString(),
      error: error.message,
    })
  }

  // Check Redis
  try {
    const redisStart = Date.now()
    const redis = getRedisClient()
    if (redis) {
      await redis.ping()
      const redisLatency = Date.now() - redisStart
      services.push({
        name: "Redis Cache",
        status: "healthy",
        latency: `${redisLatency}ms`,
        lastCheck: new Date().toISOString(),
      })
    } else {
      services.push({
        name: "Redis Cache",
        status: "degraded",
        latency: "N/A",
        lastCheck: new Date().toISOString(),
        error: "Redis not configured",
      })
    }
  } catch (error) {
    services.push({
      name: "Redis Cache",
      status: "critical",
      latency: "N/A",
      lastCheck: new Date().toISOString(),
      error: error.message,
    })
  }

  // API Server is healthy if we got here
  services.push({
    name: "API Server",
    status: "healthy",
    latency: `${Date.now() - startTime}ms`,
    lastCheck: new Date().toISOString(),
  })

  // Determine overall status
  const criticalServices = services.filter((s) => s.status === "critical")
  const degradedServices = services.filter((s) => s.status === "degraded")

  let overallStatus = "healthy"
  if (criticalServices.length > 0) {
    overallStatus = "critical"
  } else if (degradedServices.length > 0) {
    overallStatus = "degraded"
  }

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services,
    rto: "< 30 minutes",
    rpo: "< 5 minutes",
  })
}
