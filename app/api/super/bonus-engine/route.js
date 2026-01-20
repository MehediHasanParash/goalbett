import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import BonusTemplate from "@/lib/models/BonusTemplate"
import PlayerBonus from "@/lib/models/PlayerBonus"
import CashbackLevel from "@/lib/models/CashbackLevel"
import { bonusEngine } from "@/lib/bonus-engine"

export async function GET(request) {
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
    const { searchParams } = new URL(request.url)
    const view = searchParams.get("view") || "overview"

    if (view === "overview") {
      const [
        totalTemplates,
        activeTemplates,
        totalPlayerBonuses,
        activePlayerBonuses,
        pendingWagering,
        totalAwarded,
        totalConverted,
      ] = await Promise.all([
        BonusTemplate.countDocuments(),
        BonusTemplate.countDocuments({ status: "active" }),
        PlayerBonus.countDocuments(),
        PlayerBonus.countDocuments({ status: { $in: ["active", "wagering"] } }),
        PlayerBonus.countDocuments({ status: "wagering", "wagering.remaining": { $gt: 0 } }),
        PlayerBonus.aggregate([
          { $match: { status: { $ne: "cancelled" } } },
          { $group: { _id: null, total: { $sum: "$bonusAmount" } } },
        ]),
        PlayerBonus.aggregate([
          { $match: { status: "completed" } },
          { $group: { _id: null, total: { $sum: "$convertedToReal" } } },
        ]),
      ])

      const recentBonuses = await PlayerBonus.find()
        .populate("userId", "name email")
        .populate("bonusTemplateId", "name code type")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()

      const byType = await PlayerBonus.aggregate([
        {
          $group: {
            _id: "$bonusType",
            count: { $sum: 1 },
            totalAwarded: { $sum: "$bonusAmount" },
            totalConverted: { $sum: "$convertedToReal" },
          },
        },
      ])

      return NextResponse.json({
        success: true,
        stats: {
          totalTemplates,
          activeTemplates,
          totalPlayerBonuses,
          activePlayerBonuses,
          pendingWagering,
          totalAwarded: totalAwarded[0]?.total || 0,
          totalConverted: totalConverted[0]?.total || 0,
          conversionRate:
            totalAwarded[0]?.total > 0
              ? (((totalConverted[0]?.total || 0) / totalAwarded[0].total) * 100).toFixed(1)
              : 0,
        },
        recentBonuses,
        byType,
      })
    }

    if (view === "templates") {
      const templates = await BonusTemplate.find().sort({ priority: -1, createdAt: -1 }).lean()
      return NextResponse.json({ success: true, templates })
    }

    if (view === "player-bonuses") {
      const page = Number.parseInt(searchParams.get("page") || "1")
      const limit = Number.parseInt(searchParams.get("limit") || "20")
      const status = searchParams.get("status")
      const type = searchParams.get("type")
      const userId = searchParams.get("userId")

      const query = {}
      if (status) query.status = status
      if (type) query.bonusType = type
      if (userId) query.userId = userId

      const [bonuses, total] = await Promise.all([
        PlayerBonus.find(query)
          .populate("userId", "name email phone")
          .populate("bonusTemplateId", "name code type")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        PlayerBonus.countDocuments(query),
      ])

      return NextResponse.json({
        success: true,
        bonuses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    }

    if (view === "cashback-levels") {
      const levels = await CashbackLevel.find().sort({ tier: 1 }).lean()
      return NextResponse.json({ success: true, levels })
    }

    return NextResponse.json({ error: "Invalid view" }, { status: 400 })
  } catch (error) {
    console.error("[Bonus Engine API] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
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
    const body = await request.json()
    const { action } = body

    switch (action) {
      case "create_template": {
        const template = new BonusTemplate({
          ...body.data,
          createdBy: decoded.userId,
        })
        await template.save()
        return NextResponse.json({ success: true, template })
      }

      case "update_template": {
        const template = await BonusTemplate.findByIdAndUpdate(
          body.templateId,
          { ...body.data, updatedBy: decoded.userId },
          { new: true },
        )
        return NextResponse.json({ success: true, template })
      }

      case "delete_template": {
        await BonusTemplate.findByIdAndDelete(body.templateId)
        return NextResponse.json({ success: true })
      }

      case "toggle_template_status": {
        const template = await BonusTemplate.findById(body.templateId)
        template.status = template.status === "active" ? "paused" : "active"
        await template.save()
        return NextResponse.json({ success: true, template })
      }

      case "credit_bonus": {
        const { userId, tenantId, bonusTemplateId, amount } = body
        const playerBonus = await bonusEngine.creditManualBonus(
          userId,
          tenantId,
          bonusTemplateId,
          amount,
          decoded.userId,
        )
        return NextResponse.json({ success: true, playerBonus })
      }

      case "cancel_bonus": {
        const playerBonus = await bonusEngine.cancelBonus(body.bonusId, decoded.userId, body.reason || "")
        return NextResponse.json({ success: true, playerBonus })
      }

      case "process_expired": {
        const count = await bonusEngine.processExpiredBonuses()
        return NextResponse.json({ success: true, expiredCount: count })
      }

      case "create_cashback_level": {
        const level = new CashbackLevel(body.data)
        await level.save()
        return NextResponse.json({ success: true, level })
      }

      case "update_cashback_level": {
        const level = await CashbackLevel.findByIdAndUpdate(body.levelId, body.data, { new: true })
        return NextResponse.json({ success: true, level })
      }

      case "delete_cashback_level": {
        await CashbackLevel.findByIdAndDelete(body.levelId)
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[Bonus Engine API] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
