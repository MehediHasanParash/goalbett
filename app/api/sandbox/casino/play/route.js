/**
 * Casino Play API
 *
 * Endpoints for playing sandbox casino games:
 * - POST: Initialize or play a game round
 */

import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import User from "@/lib/models/User"
import WalletService from "@/lib/services/wallet-service"
import { SandboxCasinoEngine } from "@/lib/sandbox/casino-engine"
import mongoose from "mongoose"

export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { action, gameType, stake, clientSeed, gameParams, roundId, actionParams } = body

    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const tenantId = user.tenant_id || user.tenantId || new mongoose.Types.ObjectId("000000000000000000000000")

    switch (action) {
      case "init": {
        // Initialize a new game round
        if (!gameType || !stake) {
          return NextResponse.json(
            {
              success: false,
              error: "Missing gameType or stake",
            },
            { status: 400 },
          )
        }

        const wallet = await WalletService.getPlayerWallet(decoded.userId, tenantId)
        if (!wallet) {
          return NextResponse.json({ success: false, error: "Wallet not found" }, { status: 404 })
        }

        if (wallet.availableBalance < stake) {
          return NextResponse.json(
            {
              success: false,
              error: "Insufficient balance",
              balance: wallet.availableBalance,
            },
            { status: 400 },
          )
        }

        const round = await SandboxCasinoEngine.initializeRound({
          userId: decoded.userId,
          tenantId,
          walletId: wallet._id,
          gameType,
          stake,
          clientSeed,
          gameParams,
        })

        return NextResponse.json({
          success: true,
          message: "Game round initialized",
          data: round,
        })
      }

      case "play": {
        // Play/complete a game round
        if (!roundId) {
          return NextResponse.json(
            {
              success: false,
              error: "Missing roundId",
            },
            { status: 400 },
          )
        }

        const result = await SandboxCasinoEngine.playRound(roundId, actionParams || {})

        return NextResponse.json({
          success: true,
          data: result,
        })
      }

      case "quick_play": {
        // Initialize and play in one request (for simple games)
        if (!gameType || !stake) {
          return NextResponse.json(
            {
              success: false,
              error: "Missing gameType or stake",
            },
            { status: 400 },
          )
        }

        const wallet = await WalletService.getPlayerWallet(decoded.userId, tenantId)
        if (!wallet) {
          return NextResponse.json({ success: false, error: "Wallet not found" }, { status: 404 })
        }

        if (wallet.availableBalance < stake) {
          return NextResponse.json(
            {
              success: false,
              error: "Insufficient balance",
              balance: wallet.availableBalance,
            },
            { status: 400 },
          )
        }

        const result = await SandboxCasinoEngine.quickPlay({
          userId: decoded.userId,
          tenantId,
          walletId: wallet._id,
          gameType,
          stake,
          clientSeed,
          gameParams,
          actionParams,
        })

        return NextResponse.json({
          success: true,
          data: result,
        })
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action. Use: init, play, quick_play",
          },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error("[v0] Casino play error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
