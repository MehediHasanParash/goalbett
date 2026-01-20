import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"
import Transaction from "@/lib/models/Transaction"
import Wallet from "@/lib/models/Wallet"

// POST - Agent sells credits to a player (by phone, email, username, or playerId)
export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["agent", "sub_agent", "master_agent"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Agent access required" }, { status: 403 })
    }

    await connectDB()

    const { playerId, customerPhone, email, username, amount } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Valid amount required" }, { status: 400 })
    }

    if (!playerId && !customerPhone && !email && !username) {
      return NextResponse.json(
        { success: false, error: "Player identifier required (phone, email, username, or ID)" },
        { status: 400 },
      )
    }

    // Get agent with credit info
    const agent = await User.findById(decoded.userId).select(
      "tenant_id creditLimit usedCredit balance commissionRate fullName",
    )

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    // Check agent has enough credit
    const availableCredit = agent.creditLimit - agent.usedCredit
    if (amount > availableCredit) {
      return NextResponse.json(
        { success: false, error: `Insufficient credit. Available: ${availableCredit}` },
        { status: 400 },
      )
    }

    let player = null

    if (playerId) {
      player = await User.findOne({
        _id: playerId,
        tenant_id: agent.tenant_id,
        role: "player",
      })
    } else if (customerPhone) {
      player = await User.findOne({
        phone: customerPhone,
        tenant_id: agent.tenant_id,
        role: "player",
      })
    } else if (email) {
      player = await User.findOne({
        email: email.toLowerCase(),
        tenant_id: agent.tenant_id,
        role: "player",
      })
    } else if (username) {
      player = await User.findOne({
        username: { $regex: new RegExp(`^${username}$`, "i") },
        tenant_id: agent.tenant_id,
        role: "player",
      })
    }

    if (!player) {
      const identifier = customerPhone || email || username
      const playerData = {
        fullName: `Player ${identifier?.slice(-4) || "New"}`,
        role: "player",
        tenant_id: agent.tenant_id,
        balance: 0,
        createdBy: agent._id,
      }

      if (customerPhone) {
        playerData.phone = customerPhone
        playerData.password = customerPhone.slice(-6) || "123456"
      }
      if (email) {
        playerData.email = email.toLowerCase()
        playerData.password = email.split("@")[0] || "123456"
      }
      if (username) {
        playerData.username = username
        playerData.password = username.slice(-6) || "123456"
      }

      // Ensure we have a password
      if (!playerData.password) {
        playerData.password = "123456"
      }

      player = await User.create(playerData)
    }

    // Get or create player wallet
    let playerWallet = await Wallet.findOne({ userId: player._id })
    if (!playerWallet) {
      playerWallet = await Wallet.create({
        userId: player._id,
        tenantId: agent.tenant_id,
        type: "player",
        currency: "USD",
        availableBalance: 0,
        lockedBalance: 0,
      })
    }

    // Calculate commission (default 10%)
    const commissionRate = agent.commissionRate || 10
    const commission = (amount * commissionRate) / 100

    // Update agent's used credit
    agent.usedCredit += amount
    await agent.save()

    // Update player balance
    const playerBalanceBefore = playerWallet.availableBalance
    playerWallet.availableBalance += amount
    await playerWallet.save()

    // Also update player.balance for consistency
    player.balance += amount
    await player.save()

    // Create transaction record for player
    const transaction = await Transaction.create({
      walletId: playerWallet._id,
      userId: player._id,
      tenantId: agent.tenant_id,
      type: "credit_sale",
      amount: amount,
      currency: "USD",
      balanceBefore: playerBalanceBefore,
      balanceAfter: playerWallet.availableBalance,
      status: "completed",
      processedBy: agent._id,
      description: `Credit purchased from agent ${agent.fullName}`,
      metadata: {
        agentId: agent._id.toString(),
        agentName: agent.fullName,
        commission: commission,
        customerPhone: player.phone || null,
        customerEmail: player.email || null,
        customerUsername: player.username || null,
        playerId: player._id.toString(),
        playerName: player.fullName,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        transactionId: transaction._id,
        playerId: player._id,
        playerName: player.fullName,
        amount,
        commission,
        playerNewBalance: playerWallet.availableBalance,
        agentAvailableCredit: agent.creditLimit - agent.usedCredit,
      },
    })
  } catch (error) {
    console.error("[v0] Sell credits error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// GET - Get agent's credit sales history
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["agent", "sub_agent", "master_agent"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Agent access required" }, { status: 403 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit")) || 20
    const todayOnly = searchParams.get("today") === "true"

    // Build query
    const query = {
      type: "credit_sale",
      processedBy: decoded.userId,
      status: "completed",
    }

    if (todayOnly) {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      query.createdAt = { $gte: startOfDay }
    }

    const transactions = await Transaction.find(query).sort({ createdAt: -1 }).limit(limit).lean()

    // Calculate stats
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const todayStats = await Transaction.aggregate([
      {
        $match: {
          type: "credit_sale",
          processedBy: decoded.userId,
          status: "completed",
          createdAt: { $gte: startOfDay },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$amount" },
          totalCommission: { $sum: { $toDouble: "$metadata.commission" } },
          count: { $sum: 1 },
        },
      },
    ])

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions.map((tx) => ({
          id: tx._id,
          transactionId: `TXN${tx._id.toString().slice(-6).toUpperCase()}`,
          phone: tx.metadata?.customerPhone || "N/A",
          email: tx.metadata?.customerEmail || null,
          username: tx.metadata?.customerUsername || null,
          playerName: tx.metadata?.playerName || "Unknown",
          amount: tx.amount,
          commission: tx.metadata?.commission || 0,
          status: tx.status,
          createdAt: tx.createdAt,
        })),
        stats: {
          todaySales: todayStats[0]?.totalSales || 0,
          todayCommission: todayStats[0]?.totalCommission || 0,
          todayCount: todayStats[0]?.count || 0,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Get credit sales error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
