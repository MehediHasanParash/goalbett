import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

// Mock friends data
const MOCK_FRIENDS = [
  { id: "1", username: "JohnDoe", avatar: "1", status: "online", lastActive: "now", wins: 45, bets: 120 },
  { id: "2", username: "SarahBet", avatar: "2", status: "online", lastActive: "now", wins: 32, bets: 89 },
  { id: "3", username: "MikeWins", avatar: "3", status: "offline", lastActive: "2 hours ago", wins: 28, bets: 75 },
  { id: "4", username: "LuckyLisa", avatar: "4", status: "offline", lastActive: "1 day ago", wins: 51, bets: 145 },
  { id: "5", username: "BetKing99", avatar: "5", status: "online", lastActive: "now", wins: 67, bets: 210 },
]

const MOCK_PENDING = [
  { id: "6", username: "NewPlayer1", avatar: "6", status: "pending", sentAt: "2 hours ago" },
  { id: "7", username: "CasinoFan", avatar: "7", status: "pending", sentAt: "1 day ago" },
]

const MOCK_REFERRAL = {
  code: "BETMAX2024",
  link: "https://goalbett.com/ref/BETMAX2024",
  totalReferred: 5,
  totalEarned: 250,
  pendingRewards: 50,
  referrals: [
    { username: "Player1", status: "deposited", reward: 50, date: "2024-01-15" },
    { username: "Player2", status: "deposited", reward: 50, date: "2024-01-10" },
    { username: "Player3", status: "registered", reward: 0, date: "2024-01-08" },
    { username: "Player4", status: "deposited", reward: 50, date: "2024-01-05" },
    { username: "Player5", status: "deposited", reward: 50, date: "2024-01-01" },
  ],
}

export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded?.userId) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all" // all, pending, referrals

    // Return mock data based on type
    if (type === "referrals") {
      return NextResponse.json({
        success: true,
        referral: MOCK_REFERRAL,
      })
    }

    if (type === "pending") {
      return NextResponse.json({
        success: true,
        friends: MOCK_PENDING,
      })
    }

    return NextResponse.json({
      success: true,
      friends: MOCK_FRIENDS,
      pending: MOCK_PENDING,
      referral: MOCK_REFERRAL,
    })
  } catch (error) {
    console.error("Friends API error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Send friend request or accept/decline
export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded?.userId) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const { action, friendId, username } = await request.json()

    switch (action) {
      case "send_request":
        return NextResponse.json({
          success: true,
          message: `Friend request sent to ${username}`,
        })
      case "accept":
        return NextResponse.json({
          success: true,
          message: "Friend request accepted",
        })
      case "decline":
        return NextResponse.json({
          success: true,
          message: "Friend request declined",
        })
      case "remove":
        return NextResponse.json({
          success: true,
          message: "Friend removed",
        })
      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Friends action error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
