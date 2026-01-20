import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Voucher from "@/lib/models/Voucher"
import { verifyToken } from "@/lib/jwt"

// POST - Validate a voucher code (check without redeeming)
export async function POST(request) {
  try {
    await dbConnect()

    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body

    if (!code || code.trim() === "") {
      return NextResponse.json({ success: false, error: "Voucher code is required" }, { status: 400 })
    }

    const normalizedCode = code.trim().toUpperCase()

    const voucher = await Voucher.findOne({ code: normalizedCode })
    if (!voucher) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: "Invalid voucher code",
        },
        { status: 404 },
      )
    }

    // Check tenant
    if (decoded.tenant_id && voucher.tenantId.toString() !== decoded.tenant_id) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: "This voucher is not valid for your account",
        },
        { status: 400 },
      )
    }

    // Check status
    if (voucher.status !== "unused") {
      return NextResponse.json({
        success: false,
        valid: false,
        error:
          voucher.status === "redeemed"
            ? "This voucher has already been redeemed"
            : `This voucher is ${voucher.status}`,
      })
    }

    // Check expiry
    if (new Date() > voucher.expiresAt) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: "This voucher has expired",
      })
    }

    return NextResponse.json({
      success: true,
      valid: true,
      data: {
        amount: voucher.amount,
        currency: voucher.currency,
        expiresAt: voucher.expiresAt,
      },
    })
  } catch (error) {
    console.error("[v0] Validate voucher error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
