import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import B2BSettlement from "@/lib/models/B2BSettlement"
import Tenant from "@/lib/models/Tenant"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/jwt"

// Helper to get auth token
function getAuthToken(request) {
  const authHeader = request.headers.get("Authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7)
    if (token && token !== "null" && token !== "undefined") {
      return token
    }
  }
  const cookieStore = cookies()
  return cookieStore.get("auth_token")?.value || null
}

// GET /api/super/b2b-settlements - List all B2B settlements
export async function GET(request) {
  try {
    await dbConnect()

    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json({ success: false, error: "No authentication token" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["superadmin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const tenantId = searchParams.get("tenantId")
    const amlStatus = searchParams.get("amlStatus")
    const txHash = searchParams.get("txHash")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const query = {}
    if (status) query.status = status
    if (type) query.type = type
    if (tenantId) query.tenant_id = tenantId
    if (amlStatus) query["compliance.amlScreeningStatus"] = amlStatus
    if (txHash) query["blockchain.txHash"] = { $regex: txHash, $options: "i" }
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const [settlements, total] = await Promise.all([
      B2BSettlement.find(query)
        .populate("tenant_id", "name subdomain")
        .populate("processedBy", "fullName email")
        .populate("approvedBy", "fullName email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      B2BSettlement.countDocuments(query),
    ])

    // Calculate stats
    const stats = await B2BSettlement.aggregate([
      {
        $group: {
          _id: null,
          totalVolume: { $sum: "$amount.value" },
          totalTransactions: { $sum: 1 },
          pendingAML: {
            $sum: {
              $cond: [{ $eq: ["$compliance.amlScreeningStatus", "pending"] }, 1, 0],
            },
          },
          flaggedAML: {
            $sum: {
              $cond: [{ $in: ["$compliance.amlScreeningStatus", ["flagged", "manual_review"]] }, 1, 0],
            },
          },
        },
      },
    ])

    return NextResponse.json({
      success: true,
      settlements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: stats[0] || { totalVolume: 0, totalTransactions: 0, pendingAML: 0, flaggedAML: 0 },
    })
  } catch (error) {
    console.error("B2B Settlements GET error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch settlements" }, { status: 500 })
  }
}

// POST /api/super/b2b-settlements - Create new B2B settlement
export async function POST(request) {
  try {
    await dbConnect()

    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json({ success: false, error: "No authentication token" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["superadmin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { tenantId, type, direction, fromParty, toParty, amount, txHash, network, reference, description } = body

    // Validate required fields
    if (!tenantId || !type || !txHash || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: tenantId, type, txHash, amount" },
        { status: 400 },
      )
    }

    // Check if txHash already exists
    const existingTx = await B2BSettlement.findByTxHash(txHash)
    if (existingTx) {
      return NextResponse.json(
        { success: false, error: "Transaction with this hash already exists", existingSettlement: existingTx._id },
        { status: 409 },
      )
    }

    // Get tenant info
    const tenant = await Tenant.findById(tenantId)
    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 })
    }

    // Build explorer URL based on network
    const explorerUrls = {
      TRC20: `https://tronscan.org/#/transaction/${txHash}`,
      ERC20: `https://etherscan.io/tx/${txHash}`,
      BEP20: `https://bscscan.com/tx/${txHash}`,
    }

    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const settlementId = `B2B-${timestamp}-${random}`

    const settlement = await B2BSettlement.create({
      settlementId, // Include generated settlementId
      tenant_id: tenantId,
      type,
      direction: direction || "inbound",
      fromParty: fromParty || { type: "external", walletAddress: "Unknown" },
      toParty: toParty || { type: "platform", name: "GoalBett Platform" },
      amount: {
        value: Number.parseFloat(amount),
        currency: "USDT",
        network: network || "TRC20",
      },
      blockchain: {
        txHash,
        explorerUrl: explorerUrls[network || "TRC20"],
        confirmations: 0,
      },
      compliance: {
        amlScreeningStatus: "pending",
      },
      reference,
      description,
      processedBy: decoded.userId,
      status: "pending",
    })

    return NextResponse.json({
      success: true,
      settlement,
      message: "Settlement created. AML screening pending.",
    })
  } catch (error) {
    console.error("B2B Settlements POST error:", error)
    return NextResponse.json({ success: false, error: "Failed to create settlement" }, { status: 500 })
  }
}
