import { NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth-middleware"
import { financialEngine } from "@/lib/services/financial-enforcement-engine"

export async function GET(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      tenantId: searchParams.get("tenantId"),
      userId: searchParams.get("userId"),
      betId: searchParams.get("betId"),
      type: searchParams.get("type"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    }

    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")

    const result = await financialEngine.getLedgerEntries(filters, limit, offset)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[GET /api/financial/ledger] Error:", error)
    return NextResponse.json({ error: "Internal server error", message: error.message }, { status: 500 })
  }
}
