import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import BonusTemplate from "@/lib/models/BonusTemplate"
import PlayerBonus from "@/lib/models/PlayerBonus"

export async function GET(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectToDatabase()
    const { id } = await params

    const template = await BonusTemplate.findById(id).lean()
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Get claim stats
    const claimStats = await PlayerBonus.aggregate([
      { $match: { bonusTemplateId: template._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$bonusAmount" },
        },
      },
    ])

    return NextResponse.json({
      success: true,
      template,
      claimStats,
    })
  } catch (error) {
    console.error("[Bonus Template API] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectToDatabase()
    const { id } = await params
    const data = await request.json()

    const template = await BonusTemplate.findByIdAndUpdate(
      id,
      {
        ...data,
        updatedBy: decoded.userId,
      },
      { new: true },
    )

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, template })
  } catch (error) {
    console.error("[Bonus Template API] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["superadmin", "super_admin", "tenant_admin"].includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectToDatabase()
    const { id } = await params

    // Check if template has active claims
    const activeClaims = await PlayerBonus.countDocuments({
      bonusTemplateId: id,
      status: { $in: ["active", "wagering"] },
    })

    if (activeClaims > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${activeClaims} active bonuses using this template`,
        },
        { status: 400 },
      )
    }

    await BonusTemplate.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Bonus Template API] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
