import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { AgentTopupService } from "@/lib/services/agent-topup-service"
import connectDB from "@/lib/db"

// POST - Admin tops up agent float
export async function POST(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    await connectDB()

    const resolvedParams = await params
    const { id: agentId } = resolvedParams
    const body = await request.json()
    const { amount, fundingType, cashReceiptPhotoUrl, witnessPhoneNumbers, bankReference, location } = body

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Valid amount is required" }, { status: 400 })
    }

    if (!fundingType) {
      return NextResponse.json({ success: false, error: "Funding type is required" }, { status: 400 })
    }

    // Call service
    const result = await AgentTopupService.topupAgentFloat({
      adminId: decoded.userId,
      agentId,
      amount: Number.parseFloat(amount),
      currency: body.currency || "ETB",
      fundingType,
      tenantId: decoded.tenant_id || decoded.tenantId,
      metadata: {
        cashReceiptPhotoUrl,
        witnessPhoneNumbers,
        bankReference,
        location,
        channel: "admin_portal",
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        newTenantBalance: result.newTenantBalance,
        newAgentBalance: result.newAgentBalance,
      },
    })
  } catch (error) {
    console.error("[v0] Agent topup error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
