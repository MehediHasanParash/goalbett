import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import JurisdictionRule from "@/lib/models/JurisdictionRule"
import { verifyAuth } from "@/lib/auth-middleware"
import { logAudit } from "@/lib/audit-logger"

export async function GET(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || (auth.user?.role !== "super_admin" && auth.user?.role !== "superadmin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const rules = await JurisdictionRule.find()
      .populate("createdBy", "name email")
      .populate("lastModifiedBy", "name email")
      .sort({ createdAt: -1 })

    return NextResponse.json(rules)
  } catch (error) {
    console.error("[GET /api/super/jurisdiction-rules] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || (auth.user?.role !== "super_admin" && auth.user?.role !== "superadmin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const data = await request.json()

    console.log("[POST /api/super/jurisdiction-rules] Received:", {
      countryCode: data.countryCode,
      playerDeductions: data.playerDeductions?.length || 0,
      operatorDeductions: data.operatorDeductions?.length || 0,
      limits: data.limits,
      featuresAllowed: data.featuresAllowed,
    })

    if (!data.countryCode || !data.countryName) {
      return NextResponse.json({ error: "Country code and name are required" }, { status: 400 })
    }

    if (data.status === "active" && !data.changeReason) {
      return NextResponse.json({ error: "Change reason required for active rules" }, { status: 400 })
    }

    const existing = await JurisdictionRule.findOne({
      countryCode: data.countryCode.toUpperCase(),
      profileName: data.profileName || "standard",
      status: "active",
    })

    if (existing && data.status === "active") {
      existing.status = "archived"
      existing.effectiveTo = new Date()
      await existing.save()
      console.log("[POST] Archived existing active rule:", existing._id)
    }

    const sanitizeDeduction = (d, defaultAccount) => ({
      name: d.name || "other",
      enabled: d.enabled !== false,
      percentage: parseFloat(d.percentage) || 0,
      threshold: parseFloat(d.threshold) || 0,
      calculationBase: d.calculationBase || "gross_win",
      appliesTo: d.appliesTo || "player",
      applicationOrder: parseInt(d.applicationOrder) || 1,
      destinationAccount: d.destinationAccount || defaultAccount,
      rounding: d.rounding || "normal",
      description: d.description || "",
    })

    const ruleData = {
      countryCode: data.countryCode.toUpperCase(),
      countryName: data.countryName,
      profileName: data.profileName || "standard",
      version: existing && data.status === "active" ? existing.version + 1 : 1,
      effectiveFrom: new Date(),
      status: data.status || "draft",
      baseCurrency: data.baseCurrency || "USD",
      playerDeductions: (data.playerDeductions || []).map((d) => sanitizeDeduction(d, "tax_payable")),
      operatorDeductions: (data.operatorDeductions || []).map((d) => sanitizeDeduction(d, "operator_revenue")),
      limits: {
        maxWinPerBet: data.limits?.maxWinPerBet || null,
        maxWinPerDay: data.limits?.maxWinPerDay || null,
        maxBetAmount: data.limits?.maxBetAmount || null,
        minBetAmount: data.limits?.minBetAmount || 1,
      },
      featuresAllowed: {
        cashbackEnabled: data.featuresAllowed?.cashbackEnabled !== false,
        bonusesEnabled: data.featuresAllowed?.bonusesEnabled !== false,
        liveBettingEnabled: data.featuresAllowed?.liveBettingEnabled !== false,
        casinoEnabled: data.featuresAllowed?.casinoEnabled !== false,
        virtualSportsEnabled: data.featuresAllowed?.virtualSportsEnabled !== false,
      },
      providerLocked: data.providerLocked || false,
      lockedFields: data.lockedFields || [],
      createdBy: auth.user.userId,
      changeReason: data.changeReason || "",
      regulatoryInfo: {
        licensingBody: data.regulatoryInfo?.licensingBody || "",
        licenseNumber: data.regulatoryInfo?.licenseNumber || "",
        complianceNotes: data.regulatoryInfo?.complianceNotes || "",
      },
      previousVersionId: existing && data.status === "active" ? existing._id : null,
    }

    console.log("[POST] Creating rule with playerDeductions:", ruleData.playerDeductions.length)

    const rule = new JurisdictionRule(ruleData)

    await rule.save()
    console.log("[POST] Rule saved:", rule._id, "PlayerDeductions:", rule.playerDeductions.length)

    // Audit log
    await logAudit({
      action: "jurisdiction_rule_created",
      performedBy: auth.user.userId,
      targetType: "jurisdiction_rule",
      targetId: rule._id.toString(),
      details: {
        countryCode: rule.countryCode,
        countryName: rule.countryName,
        version: rule.version,
        status: rule.status,
        playerDeductions: rule.playerDeductions.length,
        operatorDeductions: rule.operatorDeductions.length,
        reason: data.changeReason,
      },
    })

    return NextResponse.json(rule, { status: 201 })
  } catch (error) {
    console.error("[POST /api/super/jurisdiction-rules] Error:", error)
    return NextResponse.json({ error: "Internal server error", message: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || (auth.user?.role !== "super_admin" && auth.user?.role !== "superadmin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const data = await request.json()

    if (!data.ruleId) {
      return NextResponse.json({ error: "Rule ID required" }, { status: 400 })
    }

    if (!data.changeReason) {
      return NextResponse.json({ error: "Change reason required for updates" }, { status: 400 })
    }

    const existingRule = await JurisdictionRule.findById(data.ruleId)
    if (!existingRule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    }

    const newRule = await JurisdictionRule.createNewVersion(
      data.ruleId,
      {
        playerDeductions: data.playerDeductions,
        operatorDeductions: data.operatorDeductions,
        limits: data.limits,
        featuresAllowed: data.featuresAllowed,
        baseCurrency: data.baseCurrency,
        status: data.status || "draft",
        regulatoryInfo: data.regulatoryInfo,
        providerLocked: data.providerLocked,
        lockedFields: data.lockedFields,
      },
      auth.user.userId,
      data.changeReason
    )

    await logAudit({
      action: "jurisdiction_rule_updated",
      performedBy: auth.user.userId,
      targetType: "jurisdiction_rule",
      targetId: newRule._id.toString(),
      details: {
        countryCode: newRule.countryCode,
        countryName: newRule.countryName,
        oldVersion: existingRule.version,
        newVersion: newRule.version,
        status: newRule.status,
        reason: data.changeReason,
      },
    })

    return NextResponse.json(newRule)
  } catch (error) {
    console.error("[PUT /api/super/jurisdiction-rules] Error:", error)
    return NextResponse.json({ error: "Internal server error", message: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || (auth.user?.role !== "super_admin" && auth.user?.role !== "superadmin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get("id")

    if (!ruleId) {
      return NextResponse.json({ error: "Rule ID required" }, { status: 400 })
    }

    const rule = await JurisdictionRule.findById(ruleId)
    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    }

    if (rule.status === "active") {
      return NextResponse.json(
        { error: "Cannot delete active rules. Archive them first by creating a new version." },
        { status: 400 }
      )
    }

    await JurisdictionRule.findByIdAndDelete(ruleId)

    await logAudit({
      action: "jurisdiction_rule_deleted",
      performedBy: auth.user.userId,
      targetType: "jurisdiction_rule",
      targetId: ruleId,
      details: {
        countryCode: rule.countryCode,
        countryName: rule.countryName,
        version: rule.version,
        status: rule.status,
      },
    })

    return NextResponse.json({ success: true, message: "Rule deleted successfully" })
  } catch (error) {
    console.error("[DELETE /api/super/jurisdiction-rules] Error:", error)
    return NextResponse.json({ error: "Internal server error", message: error.message }, { status: 500 })
  }
}
