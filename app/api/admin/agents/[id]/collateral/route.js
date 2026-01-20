import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import AuditLog from "@/lib/models/AuditLog"
import { verifyToken } from "@/lib/jwt"
import mongoose from "mongoose"

export async function POST(request, { params }) {
  return handleCollateralUpdate(request, params)
}

export async function PUT(request, { params }) {
  return handleCollateralUpdate(request, params)
}

async function handleCollateralUpdate(request, params) {
  try {
    await dbConnect()

    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["admin", "tenant_admin", "superadmin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { collateralDeposit, collateralRatio, action, amount, reason } = body

    const depositAmount = amount || collateralDeposit || 0

    const db = mongoose.connection.db
    const usersCollection = db.collection("users")

    const agent = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(id) })

    if (!agent || !["agent", "sub_agent", "master_agent"].includes(agent.role)) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    const oldValues = {
      collateralDeposit: agent.collateralDeposit || 0,
      collateralRatio: agent.collateralRatio || 1,
      creditLimit: agent.creditLimit || 0,
    }

    const parsedAmount = Number.parseFloat(depositAmount) || 0
    const parsedRatio = Math.max(0.1, Math.min(10, Number.parseFloat(collateralRatio) || agent.collateralRatio || 1))

    let newCollateralDeposit = 0
    if (action === "set") {
      newCollateralDeposit = parsedAmount
    } else if (action === "add") {
      newCollateralDeposit = (agent.collateralDeposit || 0) + parsedAmount
    } else if (action === "deduct") {
      newCollateralDeposit = Math.max(0, (agent.collateralDeposit || 0) - parsedAmount)
    } else {
      newCollateralDeposit = parsedAmount
    }

    const newCreditLimit = newCollateralDeposit * parsedRatio

    const usedCredit = agent.usedCredit || 0
    if (newCreditLimit < usedCredit) {
      return NextResponse.json(
        { success: false, error: `Cannot reduce credit limit below used credit ($${usedCredit})` },
        { status: 400 },
      )
    }

    const updateResult = await usersCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          collateralDeposit: newCollateralDeposit,
          collateralRatio: parsedRatio,
          creditLimit: newCreditLimit,
        },
      },
      { returnDocument: "after" },
    )

    const updatedAgent = updateResult

    // Audit log (non-blocking)
    try {
      await AuditLog.create({
        tenant_id: agent.tenant_id || decoded.tenantId || agent._id,
        actor: {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
        action: "wallet.adjust",
        resource: {
          type: "agent",
          id: agent._id.toString(),
          name: agent.fullName || agent.email,
        },
        changes: {
          before: oldValues,
          after: {
            collateralDeposit: updatedAgent.collateralDeposit,
            collateralRatio: updatedAgent.collateralRatio,
            creditLimit: updatedAgent.creditLimit,
          },
        },
        metadata: {
          endpoint: `/api/admin/agents/${id}/collateral`,
          method: "POST",
          reason: reason || action,
        },
        severity: "medium",
        tags: ["collateral", "credit-limit", reason || action].filter(Boolean),
      })
    } catch (auditError) {
      console.error("Audit log error (non-fatal):", auditError.message)
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: updatedAgent._id,
        name: updatedAgent.fullName,
        collateralDeposit: updatedAgent.collateralDeposit || 0,
        creditLimit: updatedAgent.creditLimit || 0,
        usedCredit: updatedAgent.usedCredit || 0,
        availableCredit: (updatedAgent.creditLimit || 0) - (updatedAgent.usedCredit || 0),
        collateralRatio: updatedAgent.collateralRatio || 1,
      },
    })
  } catch (error) {
    console.error("Update collateral error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
