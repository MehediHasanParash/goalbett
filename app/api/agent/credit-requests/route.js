import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"
import CreditRequest from "@/lib/models/CreditRequest"

const PAYMENT_METHOD_MAP = {
  bank_transfer: "bank",
  mpesa: "mpesa",
  orange_pay: "orange",
  crypto: "crypto",
  bank: "bank",
  orange: "orange",
  card: "card",
  airtime: "airtime",
}

// POST - Agent requests credits
export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["agent", "sub_agent", "master_agent"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Agent access required" }, { status: 403 })
    }

    await connectDB()

    const { amount, paymentMethod, transactionReference, notes, paymentProofUrl, requestType, playerId } =
      await request.json()

    if (!amount || amount < 100) {
      return NextResponse.json({ success: false, error: "Minimum request amount is $100" }, { status: 400 })
    }

    if (!paymentMethod) {
      return NextResponse.json({ success: false, error: "Payment method is required" }, { status: 400 })
    }

    const mappedPaymentMethod = PAYMENT_METHOD_MAP[paymentMethod] || "bank"
    console.log("[v0] Payment method mapping:", paymentMethod, "->", mappedPaymentMethod)

    const agent = await User.findById(decoded.userId).select("tenant_id fullName")
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    const creditRequest = await CreditRequest.create({
      agentId: decoded.userId,
      tenantId: agent.tenant_id,
      amount,
      paymentMethod: mappedPaymentMethod,
      transactionReference,
      notes,
      requestType: requestType || "self",
      playerId: playerId || undefined,
      paymentProof: paymentProofUrl
        ? {
            url: paymentProofUrl,
            uploadedAt: new Date(),
          }
        : undefined,
      status: "pending",
    })

    return NextResponse.json({
      success: true,
      data: {
        requestId: creditRequest._id,
        amount,
        status: "pending",
        message: "Credit request submitted successfully. You will be notified once approved.",
      },
    })
  } catch (error) {
    console.error("[v0] Create credit request error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// GET - Get agent's credit requests
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["agent", "sub_agent", "master_agent"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Agent access required" }, { status: 403 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit")) || 20
    const status = searchParams.get("status")

    const query = { agentId: decoded.userId }
    if (status) {
      query.status = status
    }

    const requests = await CreditRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("processedBy", "fullName")
      .lean()

    return NextResponse.json({
      success: true,
      data: requests.map((req) => ({
        id: req._id,
        requestId: `REQ-${req._id.toString().slice(-6).toUpperCase()}`,
        amount: req.amount,
        currency: req.currency,
        paymentMethod: req.paymentMethod,
        status: req.status,
        createdAt: req.createdAt,
        processedAt: req.processedAt,
        processedBy: req.processedBy?.fullName,
        rejectionReason: req.rejectionReason,
      })),
    })
  } catch (error) {
    console.error("[v0] Get credit requests error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
