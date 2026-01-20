import { NextResponse } from "next/server"

// Simple health check endpoint for domain monitoring
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "goalbett",
    version: "1.0.0",
  })
}
