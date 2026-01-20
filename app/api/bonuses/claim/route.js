import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Bonus configurations
const BONUS_CONFIG = {
  welcome: {
    name: "Welcome Bonus 100%",
    matchPercentage: 100,
    maxAmount: 500,
    type: "deposit_match",
    wageringRequirement: 10,
  },
  live_casino: {
    name: "Live Casino Bonus",
    matchPercentage: 50,
    maxAmount: 200,
    type: "deposit_match",
    wageringRequirement: 15,
  },
  sports: {
    name: "Sports Betting Bonus",
    matchPercentage: 100,
    maxAmount: 100,
    type: "free_bet",
    wageringRequirement: 5,
  },
}

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Please login to claim bonus" }, { status: 401 })
    }

    // Verify token
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return NextResponse.json({ error: "Invalid session. Please login again." }, { status: 401 })
    }

    const { bonusType } = await request.json()

    if (!bonusType || !BONUS_CONFIG[bonusType]) {
      return NextResponse.json({ error: "Invalid bonus type" }, { status: 400 })
    }

    const bonusConfig = BONUS_CONFIG[bonusType]
    const { db } = await connectToDatabase()

    // Check if user already claimed this bonus
    const existingClaim = await db.collection("bonus_claims").findOne({
      user_id: new ObjectId(decoded.userId),
      bonus_type: bonusType,
    })

    if (existingClaim) {
      return NextResponse.json({ error: "You have already claimed this bonus" }, { status: 400 })
    }

    // Get user's wallet
    const wallet = await db.collection("wallets").findOne({
      user_id: new ObjectId(decoded.userId),
    })

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found. Please contact support." }, { status: 404 })
    }

    // For welcome bonus, give a small instant bonus credit
    const instantBonus = bonusType === "welcome" ? 10 : bonusType === "live_casino" ? 5 : 5

    // Create bonus claim record
    const bonusClaim = {
      user_id: new ObjectId(decoded.userId),
      tenant_id: wallet.tenant_id,
      bonus_type: bonusType,
      bonus_name: bonusConfig.name,
      match_percentage: bonusConfig.matchPercentage,
      max_amount: bonusConfig.maxAmount,
      wagering_requirement: bonusConfig.wageringRequirement,
      instant_bonus: instantBonus,
      status: "active",
      wagered_amount: 0,
      claimed_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    }

    await db.collection("bonus_claims").insertOne(bonusClaim)

    // Add instant bonus to wallet
    await db.collection("wallets").updateOne(
      { _id: wallet._id },
      {
        $inc: { bonus_balance: instantBonus },
        $set: { updated_at: new Date() },
      },
    )

    // Create transaction record
    await db.collection("transactions").insertOne({
      user_id: new ObjectId(decoded.userId),
      tenant_id: wallet.tenant_id,
      wallet_id: wallet._id,
      type: "bonus",
      amount: instantBonus,
      description: `${bonusConfig.name} - Instant Credit`,
      status: "completed",
      created_at: new Date(),
    })

    // Create audit log
    await db.collection("audit_logs").insertOne({
      user_id: new ObjectId(decoded.userId),
      tenant_id: wallet.tenant_id,
      action: "bonus_claimed",
      details: {
        bonus_type: bonusType,
        bonus_name: bonusConfig.name,
        instant_bonus: instantBonus,
      },
      created_at: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: `Bonus claimed! $${instantBonus} bonus added to your wallet.`,
      bonus: {
        name: bonusConfig.name,
        instantBonus,
        matchPercentage: bonusConfig.matchPercentage,
        maxAmount: bonusConfig.maxAmount,
        wageringRequirement: bonusConfig.wageringRequirement,
      },
    })
  } catch (error) {
    console.error("[v0] Error claiming bonus:", error)
    return NextResponse.json({ error: "Failed to claim bonus. Please try again." }, { status: 500 })
  }
}

// GET endpoint to check bonus status
export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ claimed: [] })
    }

    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return NextResponse.json({ claimed: [] })
    }

    const { db } = await connectToDatabase()

    const claims = await db
      .collection("bonus_claims")
      .find({ user_id: new ObjectId(decoded.userId) })
      .toArray()

    return NextResponse.json({
      claimed: claims.map((c) => c.bonus_type),
      bonuses: claims,
    })
  } catch (error) {
    console.error("[v0] Error fetching bonus status:", error)
    return NextResponse.json({ claimed: [] })
  }
}
