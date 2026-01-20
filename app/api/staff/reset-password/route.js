import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import { verifyToken } from "@/lib/jwt"

// POST - Reset a staff member's password (for fixing double-hashed passwords)
export async function POST(request) {
  try {
    await connectDB()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "No token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Only superadmin or tenant_admin can reset passwords
    const allowedRoles = ["superadmin", "super_admin", "tenant_admin"]
    if (!allowedRoles.includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { staffId, newPassword } = body

    if (!staffId || !newPassword) {
      return NextResponse.json({ success: false, error: "Staff ID and new password are required" }, { status: 400 })
    }

    const staffRoles = ["finance_manager", "general_manager", "support_manager", "support_agent"]

    const staff = await User.findOne({
      _id: staffId,
      role: { $in: staffRoles },
    })

    if (!staff) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 })
    }

    // For tenant_admin, verify they own this staff member
    if (decoded.role === "tenant_admin" && staff.tenant_id?.toString() !== decoded.tenant_id?.toString()) {
      return NextResponse.json({ success: false, error: "Unauthorized - Staff not in your tenant" }, { status: 403 })
    }

    // Set plain password - the pre-save hook will hash it
    staff.password = newPassword
    await staff.save()

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    })
  } catch (error) {
    console.error("[Staff Password Reset] Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
