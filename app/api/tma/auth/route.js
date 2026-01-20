/**
 * Telegram Mini App Authentication
 *
 * Validates Telegram WebApp initData and returns JWT token
 */

import { NextResponse } from "next/server"
import crypto from "crypto"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"
import Wallet from "@/lib/models/Wallet"
import jwt from "jsonwebtoken"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

// Validate Telegram WebApp initData
function validateTelegramWebAppData(initData) {
  if (!TELEGRAM_BOT_TOKEN) return { valid: false, error: "Bot token not configured" }

  try {
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get("hash")
    urlParams.delete("hash")

    // Sort params alphabetically
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n")

    // Calculate secret key
    const secretKey = crypto.createHmac("sha256", "WebAppData").update(TELEGRAM_BOT_TOKEN).digest()

    // Calculate hash
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

    if (calculatedHash !== hash) {
      return { valid: false, error: "Invalid hash" }
    }

    // Parse user data
    const userDataStr = urlParams.get("user")
    if (!userDataStr) {
      return { valid: false, error: "No user data" }
    }

    const userData = JSON.parse(decodeURIComponent(userDataStr))

    // Check auth_date (valid for 1 hour)
    const authDate = Number(urlParams.get("auth_date"))
    const now = Math.floor(Date.now() / 1000)
    if (now - authDate > 3600) {
      return { valid: false, error: "Auth data expired" }
    }

    return { valid: true, user: userData }
  } catch (error) {
    return { valid: false, error: error.message }
  }
}

// POST - Authenticate TMA user
export async function POST(request) {
  try {
    const { initData, token } = await request.json()

    await connectDB()

    // If token provided (from /start command), verify it
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")

        if (decoded.source === "telegram") {
          const user = await User.findById(decoded.userId)
          const wallet = await Wallet.findOne({ userId: user._id })

          return NextResponse.json({
            success: true,
            token,
            user: {
              id: user._id,
              username: user.username,
              fullName: user.fullName,
              telegramId: user.telegramId,
            },
            wallet: {
              balance: wallet?.availableBalance || 0,
              bonusBalance: wallet?.bonusBalance || 0,
              currency: wallet?.currency || "USD",
            },
          })
        }
      } catch (e) {
        console.log("[TMA Auth] Token verification failed:", e.message)
      }
    }

    // Validate Telegram initData
    if (initData) {
      const validation = validateTelegramWebAppData(initData)

      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: validation.error,
          },
          { status: 401 },
        )
      }

      const telegramUser = validation.user
      const defaultTenantId = process.env.DEFAULT_TENANT_ID

      // Find or create user
      let user = await User.findOne({ telegramId: telegramUser.id.toString() })

      if (!user) {
        user = await User.create({
          telegramId: telegramUser.id.toString(),
          username: telegramUser.username || `tg_${telegramUser.id}`,
          fullName: `${telegramUser.first_name || ""} ${telegramUser.last_name || ""}`.trim(),
          role: "player",
          tenant_id: defaultTenantId,
          status: "active",
          isActive: true,
          registrationSource: "telegram_webapp",
          metadata: { telegram: telegramUser },
        })

        await Wallet.create({
          userId: user._id,
          tenantId: defaultTenantId,
          availableBalance: 100,
          currency: "USD",
          metadata: { source: "telegram_webapp", welcomeBonus: true },
        })
      }

      const wallet = await Wallet.findOne({ userId: user._id })

      // Generate JWT
      const jwtToken = jwt.sign(
        {
          userId: user._id.toString(),
          telegramId: user.telegramId,
          username: user.username,
          tenant_id: user.tenant_id?.toString(),
          role: user.role,
          source: "telegram",
        },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "7d" },
      )

      return NextResponse.json({
        success: true,
        token: jwtToken,
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          telegramId: user.telegramId,
        },
        wallet: {
          balance: wallet?.availableBalance || 0,
          bonusBalance: wallet?.bonusBalance || 0,
          currency: wallet?.currency || "USD",
        },
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: "No authentication data provided",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("[TMA Auth] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
