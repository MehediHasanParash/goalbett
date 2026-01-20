import { headers } from "next/headers"

export async function GET() {
  try {
    const headersList = headers()
    const forwarded = headersList.get("x-forwarded-for")
    const realIP = headersList.get("x-real-ip")

    // Get client IP (priority: x-forwarded-for > x-real-ip > direct connection)
    const clientIP = forwarded?.split(",")[0].trim() || realIP || "127.0.0.1"

    return Response.json({ ip: clientIP })
  } catch (error) {
    console.error("[v0] Get current IP error:", error)
    return Response.json({ error: "Failed to get current IP" }, { status: 500 })
  }
}
