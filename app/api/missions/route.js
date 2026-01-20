import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { Mission, UserMission } from "@/lib/models/Mission"

// Mock missions data for when database is empty
const MOCK_MISSIONS = [
  {
    _id: "mission_1",
    title: "First Bet",
    description: "Place your first bet to get started",
    type: "achievement",
    category: "betting",
    icon: "trophy",
    requirements: { type: "bet_count", target: 1 },
    reward: { type: "bonus", amount: 10, description: "$10 Free Bet" },
    isActive: true,
  },
  {
    _id: "mission_2",
    title: "Daily Bettor",
    description: "Place 5 bets today",
    type: "daily",
    category: "betting",
    icon: "target",
    requirements: { type: "bet_count", target: 5 },
    reward: { type: "bonus", amount: 5, description: "$5 Bonus" },
    isActive: true,
  },
  {
    _id: "mission_3",
    title: "High Roller",
    description: "Bet a total of $100 this week",
    type: "weekly",
    category: "betting",
    icon: "dollar",
    requirements: { type: "bet_amount", target: 100 },
    reward: { type: "cash", amount: 15, description: "$15 Cash Reward" },
    isActive: true,
  },
  {
    _id: "mission_4",
    title: "Winning Streak",
    description: "Win 3 bets in a row",
    type: "special",
    category: "betting",
    icon: "flame",
    requirements: { type: "win_count", target: 3 },
    reward: { type: "free_bet", amount: 25, description: "$25 Free Bet" },
    isActive: true,
  },
  {
    _id: "mission_5",
    title: "Casino Explorer",
    description: "Play 10 casino games",
    type: "weekly",
    category: "casino",
    icon: "gamepad",
    requirements: { type: "play_casino", target: 10 },
    reward: { type: "bonus", amount: 20, description: "$20 Casino Bonus" },
    isActive: true,
  },
  {
    _id: "mission_6",
    title: "Deposit Bonus",
    description: "Make a deposit of $50 or more",
    type: "special",
    category: "deposit",
    icon: "wallet",
    requirements: { type: "deposit", target: 50 },
    reward: { type: "bonus", amount: 25, description: "50% Deposit Match" },
    isActive: true,
  },
  {
    _id: "mission_7",
    title: "Loyal Player",
    description: "Log in 7 days in a row",
    type: "weekly",
    category: "loyalty",
    icon: "calendar",
    requirements: { type: "login_streak", target: 7 },
    reward: { type: "points", amount: 500, description: "500 Loyalty Points" },
    isActive: true,
  },
  {
    _id: "mission_8",
    title: "Refer a Friend",
    description: "Invite a friend who makes their first deposit",
    type: "special",
    category: "social",
    icon: "users",
    requirements: { type: "refer_friend", target: 1 },
    reward: { type: "cash", amount: 50, description: "$50 Referral Bonus" },
    isActive: true,
  },
]

// Mock user progress
const MOCK_USER_PROGRESS = {
  mission_1: { progress: 1, status: "completed" },
  mission_2: { progress: 3, status: "active" },
  mission_3: { progress: 45, status: "active" },
  mission_4: { progress: 1, status: "active" },
  mission_5: { progress: 4, status: "active" },
  mission_6: { progress: 0, status: "active" },
  mission_7: { progress: 3, status: "active" },
  mission_8: { progress: 0, status: "active" },
}

export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // daily, weekly, special, achievement
    const category = searchParams.get("category") // betting, casino, social, deposit, loyalty

    let userId = null
    if (token) {
      try {
        const decoded = verifyToken(token)
        userId = decoded?.userId
      } catch (e) {
        // Continue without user context
      }
    }

    // Try to fetch from database
    try {
      await connectDB()

      const query = { isActive: true }
      if (type) query.type = type
      if (category) query.category = category

      const missions = await Mission.find(query).sort({ order: 1, createdAt: -1 })

      if (missions.length > 0) {
        // Get user progress if authenticated
        const userProgress = {}
        if (userId) {
          const progress = await UserMission.find({ userId })
          progress.forEach((p) => {
            userProgress[p.missionId.toString()] = {
              progress: p.progress,
              status: p.status,
            }
          })
        }

        const missionsWithProgress = missions.map((mission) => ({
          ...mission.toObject(),
          userProgress: userProgress[mission._id.toString()] || { progress: 0, status: "active" },
        }))

        return NextResponse.json({ success: true, missions: missionsWithProgress })
      }
    } catch (dbError) {
      console.log("[v0] Database not available, using mock data")
    }

    // Return mock data
    let filteredMissions = [...MOCK_MISSIONS]
    if (type) filteredMissions = filteredMissions.filter((m) => m.type === type)
    if (category) filteredMissions = filteredMissions.filter((m) => m.category === category)

    const missionsWithProgress = filteredMissions.map((mission) => ({
      ...mission,
      userProgress: userId
        ? MOCK_USER_PROGRESS[mission._id] || { progress: 0, status: "active" }
        : { progress: 0, status: "active" },
    }))

    return NextResponse.json({ success: true, missions: missionsWithProgress })
  } catch (error) {
    console.error("Missions API error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Claim a mission reward
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

    const { missionId } = await request.json()
    if (!missionId) {
      return NextResponse.json({ success: false, error: "Mission ID required" }, { status: 400 })
    }

    // Mock claim response
    const mission = MOCK_MISSIONS.find((m) => m._id === missionId)
    if (!mission) {
      return NextResponse.json({ success: false, error: "Mission not found" }, { status: 404 })
    }

    const userProgress = MOCK_USER_PROGRESS[missionId]
    if (!userProgress || userProgress.status !== "completed") {
      return NextResponse.json({ success: false, error: "Mission not completed" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Reward claimed successfully!",
      reward: mission.reward,
    })
  } catch (error) {
    console.error("Claim mission error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
