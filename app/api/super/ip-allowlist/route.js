// Production-ready IP Allowlist API with database storage
import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import IpAllowlist from "@/lib/models/IpAllowlist"
import jwt from "jsonwebtoken"

// GET - Get all IP allowlist entries
export async function GET(request) {
  try {
    await connectDB()

    const clientIP =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"

    const entries = await IpAllowlist.find().sort({ createdAt: -1 })
    const isAllowed = await IpAllowlist.isIpAllowed(clientIP)

    return NextResponse.json({
      success: true,
      entries,
      clientIP,
      isAllowed,
      totalActive: entries.filter((e) => e.isActive).length,
      totalEntries: entries.length,
    })
  } catch (error) {
    console.error("[IP Allowlist] Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - Add new IP to allowlist
export async function POST(request) {
  try {
    await connectDB()

    const authHeader = request.headers.get("authorization")
    let userEmail = "system"

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret")
        userEmail = decoded.email || decoded.username || "unknown"
      } catch {
        // Continue without user info
      }
    }

    const { ip, label, type, notes, expiresAt } = await request.json()

    if (!ip || !label) {
      return NextResponse.json({ success: false, error: "IP address and label are required" }, { status: 400 })
    }

    // Validate IP format
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/

    let detectedType = "ipv4"
    if (ipv6Regex.test(ip)) {
      detectedType = "ipv6"
    } else if (cidrRegex.test(ip)) {
      detectedType = "cidr"
    } else if (!ipv4Regex.test(ip)) {
      return NextResponse.json(
        { success: false, error: "Invalid IP format. Use IPv4, IPv6, or CIDR notation" },
        { status: 400 },
      )
    }

    // Check if IP already exists
    const existing = await IpAllowlist.findOne({ ip })
    if (existing) {
      return NextResponse.json({ success: false, error: "IP already exists in allowlist" }, { status: 400 })
    }

    const entry = await IpAllowlist.create({
      ip,
      label,
      type: type || detectedType,
      notes,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      addedByEmail: userEmail,
      isActive: true,
    })

    return NextResponse.json({
      success: true,
      message: "IP added to allowlist",
      entry,
    })
  } catch (error) {
    console.error("[IP Allowlist Add] Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Remove IP from allowlist
export async function DELETE(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })
    }

    const entry = await IpAllowlist.findByIdAndDelete(id)

    if (!entry) {
      return NextResponse.json({ success: false, error: "Entry not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "IP removed from allowlist",
    })
  } catch (error) {
    console.error("[IP Allowlist Delete] Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PATCH - Update IP allowlist entry (toggle active, update expiry, etc.)
export async function PATCH(request) {
  try {
    await connectDB()

    const { id, isActive, label, notes, expiresAt } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, error: "ID required" }, { status: 400 })
    }

    const updateData = {}
    if (typeof isActive === "boolean") updateData.isActive = isActive
    if (label) updateData.label = label
    if (notes !== undefined) updateData.notes = notes
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null

    const entry = await IpAllowlist.findByIdAndUpdate(id, updateData, { new: true })

    if (!entry) {
      return NextResponse.json({ success: false, error: "Entry not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Entry updated",
      entry,
    })
  } catch (error) {
    console.error("[IP Allowlist Update] Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
