import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

// Mock leaderboard data
const MOCK_LEADERBOARD = {
  daily: [
    { rank: 1, username: "CryptoKing", avatar: "1", winnings: 5420.5, bets: 45, winRate: 68, streak: 5, change: 2 },
    { rank: 2, username: "BetMaster99", avatar: "2", winnings: 4890.25, bets: 38, winRate: 65, streak: 3, change: -1 },
    { rank: 3, username: "LuckyCharm", avatar: "3", winnings: 4250.0, bets: 52, winRate: 58, streak: 4, change: 1 },
    { rank: 4, username: "SportsGuru", avatar: "4", winnings: 3980.75, bets: 41, winRate: 61, streak: 2, change: 0 },
    { rank: 5, username: "WinnerTakes", avatar: "5", winnings: 3650.0, bets: 35, winRate: 63, streak: 6, change: 3 },
    { rank: 6, username: "BetPro2024", avatar: "6", winnings: 3420.5, bets: 29, winRate: 59, streak: 1, change: -2 },
    { rank: 7, username: "AceBetter", avatar: "7", winnings: 3100.25, bets: 33, winRate: 55, streak: 2, change: 1 },
    { rank: 8, username: "MoneyMaker", avatar: "8", winnings: 2890.0, bets: 27, winRate: 62, streak: 4, change: -1 },
    { rank: 9, username: "JackpotJoe", avatar: "9", winnings: 2650.75, bets: 24, winRate: 58, streak: 1, change: 2 },
    { rank: 10, username: "LegendBet", avatar: "10", winnings: 2400.0, bets: 31, winRate: 54, streak: 3, change: 0 },
  ],
  weekly: [
    { rank: 1, username: "BetMaster99", avatar: "2", winnings: 34275.15, bets: 245, winRate: 72, streak: 8, change: 0 },
    { rank: 2, username: "CryptoKing", avatar: "1", winnings: 32108.9, bets: 198, winRate: 69, streak: 5, change: 1 },
    { rank: 3, username: "LuckyCharm", avatar: "3", winnings: 30112.25, bets: 312, winRate: 64, streak: 6, change: -1 },
    { rank: 4, username: "WinnerTakes", avatar: "5", winnings: 29650.8, bets: 178, winRate: 67, streak: 7, change: 2 },
    { rank: 5, username: "SportsGuru", avatar: "4", winnings: 27994.6, bets: 225, winRate: 63, streak: 4, change: -1 },
    { rank: 6, username: "MoneyMaker", avatar: "8", winnings: 26478.9, bets: 156, winRate: 71, streak: 9, change: 3 },
    { rank: 7, username: "AceBetter", avatar: "7", winnings: 23710.55, bets: 189, winRate: 58, streak: 3, change: 0 },
    { rank: 8, username: "BetPro2024", avatar: "6", winnings: 21507.45, bets: 142, winRate: 61, streak: 2, change: -2 },
    { rank: 9, username: "JackpotJoe", avatar: "9", winnings: 19850.0, bets: 167, winRate: 55, streak: 5, change: 1 },
    {
      rank: 10,
      username: "LegendBet",
      avatar: "10",
      winnings: 18200.25,
      bets: 134,
      winRate: 59,
      streak: 4,
      change: -1,
    },
  ],
  monthly: [
    { rank: 1, username: "CryptoKing", avatar: "1", winnings: 142500.0, bets: 856, winRate: 74, streak: 12, change: 0 },
    { rank: 2, username: "BetMaster99", avatar: "2", winnings: 128750.5, bets: 745, winRate: 71, streak: 8, change: 0 },
    {
      rank: 3,
      username: "MoneyMaker",
      avatar: "8",
      winnings: 115200.25,
      bets: 623,
      winRate: 69,
      streak: 15,
      change: 2,
    },
    { rank: 4, username: "LuckyCharm", avatar: "3", winnings: 108900.0, bets: 912, winRate: 65, streak: 7, change: -1 },
    { rank: 5, username: "WinnerTakes", avatar: "5", winnings: 98450.75, bets: 534, winRate: 68, streak: 9, change: 1 },
    { rank: 6, username: "SportsGuru", avatar: "4", winnings: 89200.0, bets: 678, winRate: 64, streak: 6, change: -2 },
    { rank: 7, username: "AceBetter", avatar: "7", winnings: 78500.25, bets: 589, winRate: 61, streak: 5, change: 0 },
    { rank: 8, username: "BetPro2024", avatar: "6", winnings: 67800.0, bets: 456, winRate: 62, streak: 4, change: 1 },
    { rank: 9, username: "LegendBet", avatar: "10", winnings: 59200.5, bets: 512, winRate: 58, streak: 6, change: 2 },
    { rank: 10, username: "JackpotJoe", avatar: "9", winnings: 52100.0, bets: 423, winRate: 56, streak: 3, change: -3 },
  ],
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "weekly" // daily, weekly, monthly
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    let currentUserId = null
    if (token) {
      try {
        const decoded = verifyToken(token)
        currentUserId = decoded?.userId
      } catch (e) {}
    }

    // Try to fetch from database
    try {
      await connectDB()
      // In production, fetch from LeaderboardEntry model
      // For now, return mock data
    } catch (dbError) {
      console.log("[v0] Database not available, using mock data")
    }

    // Return mock data
    const leaderboard = MOCK_LEADERBOARD[period] || MOCK_LEADERBOARD.weekly
    const limited = leaderboard.slice(0, limit)

    // Mock current user's rank if authenticated
    let currentUserRank = null
    if (currentUserId) {
      currentUserRank = {
        rank: 42,
        username: "You",
        avatar: "user",
        winnings: 1250.5,
        bets: 28,
        winRate: 54,
        streak: 2,
        change: 5,
      }
    }

    return NextResponse.json({
      success: true,
      period,
      leaderboard: limited,
      currentUserRank,
      totalParticipants: 1247,
    })
  } catch (error) {
    console.error("Leaderboard API error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
