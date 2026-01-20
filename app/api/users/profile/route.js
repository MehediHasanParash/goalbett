// Player Profile Settings API - Full CRUD
import { NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import Wallet from "@/lib/models/Wallet"
import AuditLog from "@/lib/models/AuditLog"

// GET - Get current user's profile
export async function GET(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findById(auth.user.id).select("-password -mfaSecret -mfaBackupCodes").lean()

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Get wallet balance
    const wallet = await Wallet.findOne({ userId: user._id }).lean()

    return NextResponse.json({
      success: true,
      profile: {
        ...user,
        wallet: {
          balance: wallet?.availableBalance || 0,
          currency: wallet?.currency || "ETB",
        },
      },
    })
  } catch (error) {
    console.error("[Profile API] GET error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 })
  }
}

// PUT - Update current user's profile
export async function PUT(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const body = await request.json()

    const user = await User.findById(auth.user.id)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Allowed fields for player to update
    const allowedFields = [
      "fullName",
      "firstName",
      "lastName",
      "phone",
      "email",
      "dateOfBirth",
      "address",
      "city",
      "country",
      "preferredLanguage",
      "timezone",
      "notificationPreferences",
      "responsibleGamingSettings",
    ]

    const updates = {}
    const changes = []

    for (const field of allowedFields) {
      if (body[field] !== undefined && body[field] !== user[field]) {
        changes.push({ field, from: user[field], to: body[field] })
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, message: "No changes to update", profile: user })
    }

    // Apply updates
    Object.assign(user, updates)
    user.updatedAt = new Date()
    await user.save()

    // Audit log
    await AuditLog.create({
      userId: user._id,
      action: "profile_update",
      resourceType: "User",
      resourceId: user._id,
      details: { changes },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent"),
    })

    const updatedUser = await User.findById(auth.user.id).select("-password -mfaSecret -mfaBackupCodes").lean()

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedUser,
    })
  } catch (error) {
    console.error("[Profile API] PUT error:", error)
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 })
  }
}

// PATCH - Update specific profile settings
export async function PATCH(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const body = await request.json()
    const { setting, value } = body

    const user = await User.findById(auth.user.id)
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Handle specific settings
    switch (setting) {
      case "notifications":
        user.notificationPreferences = {
          ...user.notificationPreferences,
          ...value,
        }
        break

      case "responsibleGaming":
        user.responsibleGamingSettings = {
          ...user.responsibleGamingSettings,
          ...value,
          updatedAt: new Date(),
        }
        break

      case "privacy":
        user.privacySettings = {
          ...user.privacySettings,
          ...value,
        }
        break

      case "language":
        user.preferredLanguage = value
        break

      case "timezone":
        user.timezone = value
        break

      default:
        return NextResponse.json({ success: false, error: "Unknown setting" }, { status: 400 })
    }

    user.updatedAt = new Date()
    await user.save()

    await AuditLog.create({
      userId: user._id,
      action: "settings_update",
      resourceType: "User",
      resourceId: user._id,
      details: { setting, value },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    })

    return NextResponse.json({
      success: true,
      message: `${setting} settings updated`,
    })
  } catch (error) {
    console.error("[Profile API] PATCH error:", error)
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 })
  }
}
