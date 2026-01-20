import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { cookies } from "next/headers"

// Import all models
import User from "@/lib/models/User"
import Tenant from "@/lib/models/Tenant"
import Bet from "@/lib/models/Bet"
import Transaction from "@/lib/models/Transaction"
import Event from "@/lib/models/Event"
import Sport from "@/lib/models/Sport"
import League from "@/lib/models/League"
import Market from "@/lib/models/Market"
import Wallet from "@/lib/models/Wallet"
import Banner from "@/lib/models/Banner"
import Jackpot from "@/lib/models/Jackpot"
import JackpotConfig from "@/lib/models/JackpotConfig"
import BonusTemplate from "@/lib/models/BonusTemplate"
import PlayerBonus from "@/lib/models/PlayerBonus"
import GameProvider from "@/lib/models/GameProvider"
import PaymentGateway from "@/lib/models/PaymentGateway"
import SupportTicket from "@/lib/models/SupportTicket"
import AuditLog from "@/lib/models/AuditLog"
import ApiKey from "@/lib/models/ApiKey"
import SystemConfig from "@/lib/models/SystemConfig"
import LedgerEntry from "@/lib/models/LedgerEntry"
import ComplianceAlert from "@/lib/models/ComplianceAlert"
import ComplianceReport from "@/lib/models/ComplianceReport"
import TenantConfig from "@/lib/models/TenantConfig"
import LegalEntity from "@/lib/models/LegalEntity"
import SoftwareOwnership from "@/lib/models/SoftwareOwnership"

async function getAuthToken(request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }
  const cookieStore = await cookies()
  return cookieStore.get("token")?.value
}

export async function GET(request) {
  try {
    // Verify super admin access
    const token = await getAuthToken(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    const allowedRoles = ["superadmin", "super_admin", "admin"]
    if (!payload || !allowedRoles.includes(payload.role)) {
      return NextResponse.json({ error: "Super admin access required" }, { status: 403 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const includeAll = searchParams.get("full") === "true"
    const tenantId = searchParams.get("tenantId")

    // Build query filter for tenant-specific export
    const tenantFilter = tenantId ? { tenant_id: tenantId } : {}

    console.log("[v0] Starting data export...")

    // Export all collections
    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportedBy: payload.email,
        version: "1.0",
        type: tenantId ? "tenant" : "full",
        tenantId: tenantId || null,
      },

      // Core entities
      tenants: await Tenant.find(tenantId ? { _id: tenantId } : {}).lean(),
      tenantConfigs: await TenantConfig.find(tenantFilter).lean(),

      // Users (exclude password hashes for security)
      users: await User.find(tenantFilter).select("-password").lean(),

      // Wallets and financial data
      wallets: await Wallet.find(tenantFilter).lean(),
      ledgerEntries: includeAll ? await LedgerEntry.find(tenantFilter).sort({ createdAt: -1 }).limit(10000).lean() : [],
      transactions: await Transaction.find(tenantFilter)
        .sort({ createdAt: -1 })
        .limit(includeAll ? 50000 : 5000)
        .lean(),

      // Betting data
      bets: await Bet.find(tenantFilter)
        .sort({ createdAt: -1 })
        .limit(includeAll ? 100000 : 10000)
        .lean(),

      // Sports data
      sports: await Sport.find({}).lean(),
      leagues: await League.find({}).lean(),
      events: await Event.find(tenantFilter)
        .sort({ createdAt: -1 })
        .limit(includeAll ? 50000 : 5000)
        .lean(),
      markets: await Market.find({})
        .sort({ createdAt: -1 })
        .limit(includeAll ? 100000 : 10000)
        .lean(),

      // Gaming
      jackpots: await Jackpot.find(tenantFilter).lean(),
      jackpotConfigs: await JackpotConfig.find(tenantFilter).lean(),
      gameProviders: await GameProvider.find({}).lean(),

      // Bonuses
      bonusTemplates: await BonusTemplate.find(tenantFilter).lean(),
      playerBonuses: await PlayerBonus.find(tenantFilter).lean(),

      // Configuration
      banners: await Banner.find(tenantFilter).lean(),
      paymentGateways: await PaymentGateway.find(tenantFilter).lean(),
      systemConfigs: await SystemConfig.find({}).lean(),

      // Support
      supportTickets: await SupportTicket.find(tenantFilter).sort({ createdAt: -1 }).limit(5000).lean(),

      // Compliance and legal
      complianceAlerts: await ComplianceAlert.find(tenantFilter).sort({ createdAt: -1 }).limit(5000).lean(),
      complianceReports: await ComplianceReport.find(tenantFilter).lean(),
      legalEntities: await LegalEntity.find({}).lean(),
      softwareOwnership: await SoftwareOwnership.find({}).lean(),

      // API Keys (exclude actual key values for security)
      apiKeys: await ApiKey.find(tenantFilter).select("-key -hashedKey").lean(),

      // Audit logs (limited for size)
      auditLogs: includeAll ? await AuditLog.find(tenantFilter).sort({ createdAt: -1 }).limit(10000).lean() : [],
    }

    // Calculate stats
    const stats = {
      tenants: exportData.tenants.length,
      users: exportData.users.length,
      wallets: exportData.wallets.length,
      transactions: exportData.transactions.length,
      bets: exportData.bets.length,
      sports: exportData.sports.length,
      leagues: exportData.leagues.length,
      events: exportData.events.length,
      markets: exportData.markets.length,
      jackpots: exportData.jackpots.length,
      bonusTemplates: exportData.bonusTemplates.length,
      playerBonuses: exportData.playerBonuses.length,
      supportTickets: exportData.supportTickets.length,
      auditLogs: exportData.auditLogs.length,
    }

    exportData.exportInfo.stats = stats
    exportData.exportInfo.totalRecords = Object.values(stats).reduce((a, b) => a + b, 0)

    console.log("[v0] Export complete. Total records:", exportData.exportInfo.totalRecords)

    // Create filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = tenantId ? `tenant-export-${tenantId}-${timestamp}.json` : `full-system-export-${timestamp}.json`

    // Return as downloadable JSON file
    const jsonString = JSON.stringify(exportData, null, 2)

    return new Response(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": Buffer.byteLength(jsonString, "utf8").toString(),
      },
    })
  } catch (error) {
    console.error("[v0] Export error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
