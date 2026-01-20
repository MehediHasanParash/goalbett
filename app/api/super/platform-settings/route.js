import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import dbConnect from "@/lib/mongodb"
import PlatformSettings from "@/lib/models/PlatformSettings"

const VALID_ROLES = ["superadmin", "super_admin"]

// GET - Fetch platform settings
export async function GET(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !VALID_ROLES.includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized - Invalid role" }, { status: 401 })
    }

    await dbConnect()

    const settings = await PlatformSettings.getSettings()

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error("Get platform settings error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update platform settings
export async function PUT(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !VALID_ROLES.includes(decoded.role)) {
      return NextResponse.json({ error: "Unauthorized - Invalid role" }, { status: 401 })
    }

    await dbConnect()

    const body = await request.json()
    const { section, updates } = body

    // Build the update object based on section
    let updateObj = {}
    if (section === "geoBlocking") {
      updateObj = {
        "geoBlocking.enabled": updates.enabled,
        "geoBlocking.mode": updates.mode,
        "geoBlocking.defaultAction": updates.defaultAction,
        "geoBlocking.blockMessage": updates.blockMessage,
        "geoBlocking.lastModifiedBy": decoded.userId,
      }

      // Track when enabled/disabled
      if (updates.enabled !== undefined) {
        if (updates.enabled) {
          updateObj["geoBlocking.enabledAt"] = new Date()
        } else {
          updateObj["geoBlocking.disabledAt"] = new Date()
        }
      }
    } else if (section === "maintenance") {
      updateObj = {
        "maintenance.enabled": updates.enabled,
        "maintenance.message": updates.message,
        "maintenance.allowedIps": updates.allowedIps,
        "maintenance.estimatedEnd": updates.estimatedEnd,
      }
      if (updates.enabled) {
        updateObj["maintenance.startedAt"] = new Date()
      }
    } else if (section === "rateLimiting") {
      updateObj = {
        "rateLimiting.enabled": updates.enabled,
        "rateLimiting.requestsPerMinute": updates.requestsPerMinute,
        "rateLimiting.burstLimit": updates.burstLimit,
      }
    } else if (section === "stressTest") {
      updateObj = {
        "stressTest.enabled": updates.enabled,
        "stressTest.maxVirtualUsers": updates.maxVirtualUsers,
      }
    } else {
      // Generic update
      updateObj = updates
    }

    const settings = await PlatformSettings.findByIdAndUpdate(
      "platform_settings",
      { $set: updateObj },
      { new: true, upsert: true },
    )

    return NextResponse.json({
      success: true,
      settings,
      message: `${section || "Settings"} updated successfully`,
    })
  } catch (error) {
    console.error("Update platform settings error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
