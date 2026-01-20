import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"

export async function POST() {
  try {
    await dbConnect()

    // Find the super admin user
    const superAdmin = await User.findOne({ role: "superadmin" })

    if (!superAdmin) {
      return NextResponse.json({ success: false, error: "Super admin not found" }, { status: 404 })
    }

    // Add email if missing
    if (!superAdmin.email) {
      superAdmin.email = "super@gmail.com"
      await superAdmin.save()

      return NextResponse.json({
        success: true,
        message: "Super admin email restored",
        email: superAdmin.email,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Super admin already has email",
      email: superAdmin.email,
    })
  } catch (error) {
    console.error("Error fixing super admin email:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
