import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Voucher from "@/lib/models/Voucher"
import { verifyToken } from "@/lib/jwt"

// PATCH - Cancel voucher (super admin)
export async function PATCH(request, { params }) {
  try {
    await dbConnect()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["superadmin", "super_admin"].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (action === "cancel") {
      const voucher = await Voucher.findById(id)
      if (!voucher) {
        return NextResponse.json({ success: false, error: "Voucher not found" }, { status: 404 })
      }

      if (voucher.status !== "unused") {
        return NextResponse.json({ success: false, error: "Only unused vouchers can be cancelled" }, { status: 400 })
      }

      voucher.status = "cancelled"
      voucher.cancelledAt = new Date()
      voucher.cancelledBy = decoded.userId
      await voucher.save()

      return NextResponse.json({
        success: true,
        data: { voucher },
      })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Cancel voucher error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
