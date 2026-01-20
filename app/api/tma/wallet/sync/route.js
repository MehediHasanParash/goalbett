// TMA Wallet Sync API - 1:1 wallet sync between Web and Telegram
import { NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import { WalletSyncService } from "@/lib/services/wallet-sync-service"

// GET - Get synced wallet balance
export async function GET(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const wallet = await WalletSyncService.getWallet(auth.user.id, auth.user.tenant_id)

    if (!wallet) {
      return NextResponse.json({ success: false, error: "Wallet not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      wallet,
      syncedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[TMA Wallet Sync] GET error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch wallet" }, { status: 500 })
  }
}

// POST - Force sync wallet
export async function POST(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const body = await request.json()
    const { forceRefresh = false } = body

    const result = await WalletSyncService.syncBalance(auth.user.id, auth.user.tenant_id, {
      forceRefresh,
      source: "telegram",
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      wallet: result.wallet,
      message: "Wallet synced successfully",
    })
  } catch (error) {
    console.error("[TMA Wallet Sync] POST error:", error)
    return NextResponse.json({ success: false, error: "Failed to sync wallet" }, { status: 500 })
  }
}
