import { NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth-middleware"
import { connectDB } from "@/lib/db"
import SystemAccount from "@/lib/models/SystemAccount"

export async function GET(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const accountType = searchParams.get("accountType")

    const query = { status: "active" }
    if (tenantId) query.tenantId = tenantId
    if (accountType) query.accountType = accountType

    const accounts = await SystemAccount.find(query).sort({ createdAt: -1 })

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error("[GET /api/financial/system-accounts] Error:", error)
    return NextResponse.json({ error: "Internal server error", message: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.authenticated || !["super_admin", "superadmin"].includes(auth.user?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const data = await request.json()

    if (!data.accountName || !data.accountType) {
      return NextResponse.json({ error: "Account name and type are required" }, { status: 400 })
    }

    const account = new SystemAccount({
      accountName: data.accountName,
      accountType: data.accountType,
      tenantId: data.tenantId || null,
      countryCode: data.countryCode || null,
      currency: data.currency || "USD",
      description: data.description || "",
      destinationInfo: data.destinationInfo || {},
      createdBy: auth.user.userId,
    })

    await account.save()

    return NextResponse.json({ success: true, account }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/financial/system-accounts] Error:", error)
    return NextResponse.json({ error: "Internal server error", message: error.message }, { status: 500 })
  }
}
