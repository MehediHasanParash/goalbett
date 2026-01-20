import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import Transaction from "@/lib/models/Transaction"
import Bet from "@/lib/models/Bet"
import { verifyToken } from "@/lib/jwt"

// POST /api/agent/print-slip - Generate thermal print slip data
export async function POST(request) {
  try {
    await dbConnect()

    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["agent", "sub_agent", "master_agent"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Agent access required" }, { status: 403 })
    }

    const body = await request.json()
    const { type, data } = body

    const agent = await User.findById(decoded.userId)
      .select("fullName username phone tenant_id")
      .populate("tenant_id", "name brandName")

    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    let slipData = {}
    const timestamp = new Date().toISOString()
    const slipId = `SLP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    switch (type) {
      case "deposit":
        slipData = {
          slipId,
          type: "DEPOSIT RECEIPT",
          timestamp,
          agent: {
            name: agent.fullName || agent.username,
            phone: agent.phone,
            brand: agent.tenant_id?.brandName || agent.tenant_id?.name || "Unknown",
          },
          transaction: {
            playerId: data.playerId,
            playerName: data.playerName,
            amount: data.amount,
            currency: data.currency || "USD",
            reference: data.reference || slipId,
          },
          footer: "Thank you for your deposit!",
        }
        break

      case "withdrawal":
        slipData = {
          slipId,
          type: "WITHDRAWAL RECEIPT",
          timestamp,
          agent: {
            name: agent.fullName || agent.username,
            phone: agent.phone,
            brand: agent.tenant_id?.brandName || agent.tenant_id?.name || "Unknown",
          },
          transaction: {
            playerId: data.playerId,
            playerName: data.playerName,
            amount: data.amount,
            currency: data.currency || "USD",
            reference: data.reference || slipId,
          },
          footer: "Withdrawal processed successfully!",
        }
        break

      case "bet":
        slipData = {
          slipId,
          type: "BET SLIP",
          timestamp,
          agent: {
            name: agent.fullName || agent.username,
            phone: agent.phone,
            brand: agent.tenant_id?.brandName || agent.tenant_id?.name || "Unknown",
          },
          bet: {
            betId: data.betId,
            playerName: data.playerName,
            selections: data.selections || [],
            totalOdds: data.totalOdds,
            stake: data.stake,
            potentialWin: data.potentialWin,
            currency: data.currency || "USD",
          },
          footer: "Good luck!",
        }
        break

      case "daily_summary":
        // Get today's transactions for this agent
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [deposits, withdrawals, bets] = await Promise.all([
          Transaction.aggregate([
            {
              $match: {
                agentId: agent._id,
                type: "deposit",
                createdAt: { $gte: today },
              },
            },
            { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
          ]),
          Transaction.aggregate([
            {
              $match: {
                agentId: agent._id,
                type: "withdrawal",
                createdAt: { $gte: today },
              },
            },
            { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
          ]),
          Bet.aggregate([
            {
              $match: {
                agentId: agent._id,
                createdAt: { $gte: today },
              },
            },
            { $group: { _id: null, total: { $sum: "$stake" }, count: { $sum: 1 } } },
          ]),
        ])

        slipData = {
          slipId,
          type: "DAILY SUMMARY",
          timestamp,
          date: today.toDateString(),
          agent: {
            name: agent.fullName || agent.username,
            phone: agent.phone,
            brand: agent.tenant_id?.brandName || agent.tenant_id?.name || "Unknown",
          },
          summary: {
            deposits: {
              count: deposits[0]?.count || 0,
              total: deposits[0]?.total || 0,
            },
            withdrawals: {
              count: withdrawals[0]?.count || 0,
              total: withdrawals[0]?.total || 0,
            },
            bets: {
              count: bets[0]?.count || 0,
              total: bets[0]?.total || 0,
            },
            netCashflow: (deposits[0]?.total || 0) - (withdrawals[0]?.total || 0),
          },
          footer: "End of day summary",
        }
        break

      default:
        return NextResponse.json({ success: false, error: "Invalid slip type" }, { status: 400 })
    }

    // Generate thermal printer commands (ESC/POS compatible)
    const escPosCommands = generateEscPosCommands(slipData)

    return NextResponse.json({
      success: true,
      slip: slipData,
      escPos: escPosCommands,
      printUrl: `/api/agent/print-slip/render?data=${encodeURIComponent(JSON.stringify(slipData))}`,
    })
  } catch (error) {
    console.error("Print slip error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Generate ESC/POS commands for thermal printers
function generateEscPosCommands(slipData) {
  const ESC = "\x1B"
  const GS = "\x1D"

  let commands = ""

  // Initialize printer
  commands += ESC + "@" // Initialize

  // Center align
  commands += ESC + "a" + "\x01"

  // Bold on
  commands += ESC + "E" + "\x01"

  // Title
  commands += slipData.type + "\n"
  commands += "================================\n"

  // Bold off
  commands += ESC + "E" + "\x00"

  // Left align
  commands += ESC + "a" + "\x00"

  // Agent info
  commands += `Agent: ${slipData.agent.name}\n`
  commands += `Brand: ${slipData.agent.brand}\n`
  commands += `Date: ${new Date(slipData.timestamp).toLocaleString()}\n`
  commands += `Slip: ${slipData.slipId}\n`
  commands += "--------------------------------\n"

  // Content based on type
  if (slipData.transaction) {
    commands += `Player: ${slipData.transaction.playerName}\n`
    commands += `Amount: ${slipData.transaction.currency} ${slipData.transaction.amount}\n`
    commands += `Ref: ${slipData.transaction.reference}\n`
  }

  if (slipData.bet) {
    commands += `Player: ${slipData.bet.playerName}\n`
    commands += `Bet ID: ${slipData.bet.betId}\n`
    if (slipData.bet.selections?.length) {
      commands += "Selections:\n"
      slipData.bet.selections.forEach((s, i) => {
        commands += `  ${i + 1}. ${s.event} - ${s.selection} @${s.odds}\n`
      })
    }
    commands += `Total Odds: ${slipData.bet.totalOdds}\n`
    commands += `Stake: ${slipData.bet.currency} ${slipData.bet.stake}\n`
    commands += `Potential Win: ${slipData.bet.currency} ${slipData.bet.potentialWin}\n`
  }

  if (slipData.summary) {
    commands += `Deposits: ${slipData.summary.deposits.count} = $${slipData.summary.deposits.total}\n`
    commands += `Withdrawals: ${slipData.summary.withdrawals.count} = $${slipData.summary.withdrawals.total}\n`
    commands += `Bets: ${slipData.summary.bets.count} = $${slipData.summary.bets.total}\n`
    commands += "--------------------------------\n"
    commands += `Net Cashflow: $${slipData.summary.netCashflow}\n`
  }

  commands += "--------------------------------\n"

  // Center footer
  commands += ESC + "a" + "\x01"
  commands += slipData.footer + "\n\n"

  // Cut paper
  commands += GS + "V" + "\x00"

  return Buffer.from(commands).toString("base64")
}
