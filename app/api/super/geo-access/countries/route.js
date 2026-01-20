import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import CountryAccessRule from "@/lib/models/CountryAccessRule"
import CountryRuleHistory from "@/lib/models/CountryRuleHistory"
import { verifyToken } from "@/lib/auth"
import { invalidateCountryRulesCache } from "@/lib/services/geo-access-service"

// List of all countries for reference
const ALL_COUNTRIES = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei" },
  { code: "BG", name: "Bulgaria" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "CR", name: "Costa Rica" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "SV", name: "El Salvador" },
  { code: "EE", name: "Estonia" },
  { code: "ET", name: "Ethiopia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "GT", name: "Guatemala" },
  { code: "HN", name: "Honduras" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KP", name: "North Korea" },
  { code: "KR", name: "South Korea" },
  { code: "KW", name: "Kuwait" },
  { code: "KG", name: "Kyrgyzstan" },
  { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LY", name: "Libya" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MO", name: "Macau" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "MT", name: "Malta" },
  { code: "MX", name: "Mexico" },
  { code: "MD", name: "Moldova" },
  { code: "MC", name: "Monaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MA", name: "Morocco" },
  { code: "MM", name: "Myanmar" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NI", name: "Nicaragua" },
  { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PA", name: "Panama" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "RS", name: "Serbia" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ZA", name: "South Africa" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SD", name: "Sudan" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "SY", name: "Syria" },
  { code: "TW", name: "Taiwan" },
  { code: "TJ", name: "Tajikistan" },
  { code: "TZ", name: "Tanzania" },
  { code: "TH", name: "Thailand" },
  { code: "TR", name: "Turkey" },
  { code: "TM", name: "Turkmenistan" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
]

// GET - List all country rules
export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    // Get all rules
    const rules = await CountryAccessRule.find().sort({ countryName: 1 }).lean()

    // Create a map of existing rules
    const rulesMap = new Map(rules.map((r) => [r.countryCode, r]))

    // Merge with all countries list to show unconfigured countries too
    const allCountriesWithRules = ALL_COUNTRIES.map((country) => {
      const rule = rulesMap.get(country.code)
      return rule
        ? { ...rule, countryName: country.name }
        : {
            countryCode: country.code,
            countryName: country.name,
            status: "ALLOW",
            enabled: false,
            reason: "",
            blockSignup: true,
            blockLogin: false,
            blockDeposits: true,
            blockWithdrawals: true,
            blockBetting: true,
            blockCasino: true,
          }
    })

    // Get stats
    const blockedCount = rules.filter((r) => r.status === "BLOCK" && r.enabled).length
    const allowedCount = ALL_COUNTRIES.length - blockedCount

    return NextResponse.json({
      success: true,
      countries: allCountriesWithRules,
      stats: {
        total: ALL_COUNTRIES.length,
        blocked: blockedCount,
        allowed: allowedCount,
      },
    })
  } catch (error) {
    console.error("Error fetching country rules:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Create or update country rule
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const {
      countryCode,
      countryName,
      status,
      reason,
      enabled = true,
      blockSignup = true,
      blockLogin = false,
      blockDeposits = true,
      blockWithdrawals = true,
      blockBetting = true,
      blockCasino = true,
    } = body

    if (!countryCode) {
      return NextResponse.json({ success: false, error: "Country code is required" }, { status: 400 })
    }

    // Find existing rule
    const existingRule = await CountryAccessRule.findOne({ countryCode: countryCode.toUpperCase() })

    const oldValues = existingRule
      ? {
          status: existingRule.status,
          enabled: existingRule.enabled,
          reason: existingRule.reason,
          blockSignup: existingRule.blockSignup,
          blockLogin: existingRule.blockLogin,
          blockDeposits: existingRule.blockDeposits,
          blockWithdrawals: existingRule.blockWithdrawals,
          blockBetting: existingRule.blockBetting,
          blockCasino: existingRule.blockCasino,
        }
      : null

    // Upsert rule
    const rule = await CountryAccessRule.findOneAndUpdate(
      { countryCode: countryCode.toUpperCase() },
      {
        countryCode: countryCode.toUpperCase(),
        countryName: countryName || ALL_COUNTRIES.find((c) => c.code === countryCode.toUpperCase())?.name,
        status,
        reason,
        enabled,
        blockSignup,
        blockLogin,
        blockDeposits,
        blockWithdrawals,
        blockBetting,
        blockCasino,
        updatedBy: decoded.userId,
        updatedByEmail: decoded.email,
      },
      { upsert: true, new: true },
    )

    // Log history
    await CountryRuleHistory.create({
      countryCode: countryCode.toUpperCase(),
      countryName: rule.countryName,
      actionType: existingRule ? "UPDATE" : "CREATE",
      oldStatus: oldValues?.status,
      newStatus: status,
      oldValues,
      newValues: {
        status,
        enabled,
        reason,
        blockSignup,
        blockLogin,
        blockDeposits,
        blockWithdrawals,
        blockBetting,
        blockCasino,
      },
      changedBy: decoded.userId,
      changedByEmail: decoded.email,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent"),
    })

    // Invalidate cache
    invalidateCountryRulesCache()

    return NextResponse.json({ success: true, rule })
  } catch (error) {
    console.error("Error updating country rule:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - Bulk update country rules
export async function PUT(request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const { countryCodes, status, reason } = body

    if (!countryCodes || !Array.isArray(countryCodes) || countryCodes.length === 0) {
      return NextResponse.json({ success: false, error: "Country codes array is required" }, { status: 400 })
    }

    // Bulk update
    const results = []
    for (const code of countryCodes) {
      const countryName = ALL_COUNTRIES.find((c) => c.code === code.toUpperCase())?.name || code

      const rule = await CountryAccessRule.findOneAndUpdate(
        { countryCode: code.toUpperCase() },
        {
          countryCode: code.toUpperCase(),
          countryName,
          status,
          reason: reason || `Bulk update: ${status}`,
          enabled: true,
          updatedBy: decoded.userId,
          updatedByEmail: decoded.email,
        },
        { upsert: true, new: true },
      )

      results.push(rule)

      // Log history
      await CountryRuleHistory.create({
        countryCode: code.toUpperCase(),
        countryName,
        actionType: "UPDATE",
        newStatus: status,
        newValues: { status, reason: reason || `Bulk update: ${status}` },
        changedBy: decoded.userId,
        changedByEmail: decoded.email,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        note: `Bulk update of ${countryCodes.length} countries`,
      })
    }

    // Invalidate cache
    invalidateCountryRulesCache()

    return NextResponse.json({
      success: true,
      updated: results.length,
      rules: results,
    })
  } catch (error) {
    console.error("Error bulk updating country rules:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
