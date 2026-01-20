import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    // In a stateless JWT system, logout is handled client-side
    // But we can add token blacklisting here if needed in the future

    return NextResponse.json(
      {
        success: true,
        message: "Logout successful",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return NextResponse.json({ success: false, error: error.message || "Logout failed" }, { status: 500 })
  }
}
