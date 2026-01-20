import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Tenant from "@/lib/models/Tenant"

export async function POST() {
  try {
    await connectDB()
    console.log("[v0] == FIXING ALL TENANTS ==")

    const results = []

    // Fix GoalBet - Add localhost:3000 as domain
    const goalbet = await Tenant.findOneAndUpdate(
      { name: "GoalBet" },
      {
        $set: {
          slug: "goalbet",
          domain_list: [
            { domain: "localhost:3000", isPrimary: true, isActive: true },
            { domain: "goalbet.com", isPrimary: false, isActive: true },
          ],
          "theme.primaryColor": "#FFD700",
          "theme.secondaryColor": "#0A1A2F",
          "theme.accentColor": "#FFD700",
          "theme.brandName": "GoalBet",
          "theme.logoUrl": "/images/goal-betting-logo.png",
          status: "active",
          type: "provider",
        },
      },
      { new: true },
    )
    console.log("[v0] GoalBet fixed:", !!goalbet)
    results.push({
      name: "GoalBet",
      fixed: !!goalbet,
      slug: goalbet?.slug,
      domains: goalbet?.domain_list?.map((d) => d.domain),
      theme: goalbet?.theme,
    })

    // Fix XBet - Change slug to "xbet" so subdomain matches
    const xbet = await Tenant.findOneAndUpdate(
      { name: "XBet Gaming Ltd" },
      {
        $set: {
          slug: "xbet",
          domain_list: [{ domain: "xbet.localhost:3000", isPrimary: true, isActive: true }],
          "theme.primaryColor": "#0066FF",
          "theme.secondaryColor": "#1a1a2e",
          "theme.accentColor": "#FFD700",
          "theme.brandName": "XBet Gaming",
          "theme.logoUrl": "https://via.placeholder.com/150x50/0066FF/FFFFFF?text=XBet",
          status: "active",
          type: "client",
        },
      },
      { new: true },
    )
    console.log("[v0] XBet fixed:", !!xbet)
    results.push({
      name: "XBet",
      fixed: !!xbet,
      slug: xbet?.slug,
      theme: xbet?.theme,
    })

    // Fix 2XBet - Fix domain format and slug
    const twoxbet = await Tenant.findOneAndUpdate(
      { name: "2XBet Casino" },
      {
        $set: {
          slug: "2xbet",
          domain_list: [{ domain: "2xbet.localhost:3000", isPrimary: true, isActive: true }],
          "theme.primaryColor": "#FF0066",
          "theme.secondaryColor": "#1a1a2e",
          "theme.accentColor": "#00FFCC",
          "theme.brandName": "2XBet Casino",
          "theme.logoUrl": "https://via.placeholder.com/150x50/FF0066/FFFFFF?text=2XBet",
          status: "active",
          type: "client",
        },
      },
      { new: true },
    )
    console.log("[v0] 2XBet fixed:", !!twoxbet)
    results.push({
      name: "2XBet",
      fixed: !!twoxbet,
      slug: twoxbet?.slug,
      theme: twoxbet?.theme,
    })

    console.log("[v0] == ALL TENANTS FIXED ==")

    return NextResponse.json({
      success: true,
      message: "All tenants fixed with proper slugs, domains and themes",
      results,
      testInstructions: [
        "1. Visit http://localhost:3000 → Yellow GoalBet theme",
        "2. Visit http://xbet.localhost:3000 → Blue XBet theme",
        "3. Visit http://2xbet.localhost:3000 → Pink 2XBet theme",
        "4. Check browser console for [v0] logs to debug",
      ],
    })
  } catch (error) {
    console.error("[v0] Fix tenants error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}
