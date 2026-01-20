import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Tenant from "@/lib/models/Tenant"
import Wallet from "@/lib/models/Wallet"
import { verifyToken } from "@/lib/jwt"
import mongoose from "mongoose"

export async function GET(request) {
  console.log("[v0] [Tenant API] ========= FETCHING CURRENT TENANT =========")

  try {
    await connectDB()

    const authHeader = request.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      const decoded = verifyToken(token)

      if (decoded && (decoded.tenant_id || decoded.tenantId)) {
        const tenantId = decoded.tenant_id || decoded.tenantId
        const adminUserId = decoded.userId
        console.log("[v0] [Tenant API] JWT tenant_id:", tenantId)
        console.log("[v0] [Tenant API] JWT userId (admin):", adminUserId)

        const tenant = await Tenant.findById(tenantId).lean()

        let walletBalance = 0
        let walletCurrency = tenant?.default_currency || "USD"

        if (tenant) {
          console.log("[v0] [Tenant API] Tenant found:", tenant.name, "ID:", tenant._id.toString())
          console.log("[v0] [Tenant API] Tenant adminUserId:", tenant.adminUserId?.toString())
          console.log("[v0] [Tenant API] Tenant designId:", tenant.designId)

          const possibleIds = [tenant._id, tenant.adminUserId, adminUserId].filter(Boolean)

          const queryConditions = []
          possibleIds.forEach((id) => {
            const idStr = id.toString()
            queryConditions.push({ tenantId: idStr })
            if (mongoose.Types.ObjectId.isValid(idStr)) {
              queryConditions.push({ tenantId: new mongoose.Types.ObjectId(idStr) })
            }
          })

          console.log(
            "[v0] [Tenant API] Searching wallets with IDs:",
            possibleIds.map((id) => id.toString()),
          )

          const wallets = await Wallet.find({
            $or: queryConditions,
          }).lean()

          console.log("[v0] [Tenant API] Found", wallets.length, "wallet(s)")

          if (wallets.length > 0) {
            wallets.forEach((w, i) => {
              console.log(
                `[v0] [Tenant API] Wallet ${i + 1}: tenantId=${w.tenantId}, userId=${w.userId}, balance=${w.availableBalance}, currency=${w.currency}`,
              )
            })

            const tenantWallet =
              wallets.find((w) => !w.userId) ||
              wallets.find((w) => w.userId?.toString() === tenant.adminUserId?.toString()) ||
              wallets[0]

            walletBalance = tenantWallet.availableBalance || 0
            walletCurrency = tenantWallet.currency || tenant?.default_currency || "USD"
            console.log("[v0] [Tenant API] Selected wallet balance:", walletBalance, walletCurrency)
          } else {
            console.log("[v0] [Tenant API] No wallet found, checking all wallets in DB...")
            const allWallets = await Wallet.find({}).limit(10).lean()
            console.log("[v0] [Tenant API] Sample wallets in DB:", allWallets.length)
            allWallets.forEach((w, i) => {
              console.log(
                `[v0] [Tenant API] DB Wallet ${i + 1}: tenantId=${w.tenantId}, userId=${w.userId}, balance=${w.availableBalance}`,
              )
            })
          }
        }

        if (tenant) {
          console.log("[v0] [Tenant API] ✓ FOUND by JWT token:", tenant.name, "Balance:", walletBalance)

          return NextResponse.json({
            success: true,
            tenant: {
              _id: tenant._id,
              name: tenant.name,
              email: tenant.email,
              slug: tenant.slug,
              type: tenant.type,
              status: tenant.status,
              designId: tenant.designId || "classic",
              primaryDomain: tenant.domain_list?.find((d) => d.isPrimary)?.domain || null,
              subdomain: tenant.subdomain,
              wallet: {
                balance: walletBalance,
                currency: walletCurrency,
              },
              theme: {
                primaryColor: tenant.theme?.primaryColor || "#FFD700",
                secondaryColor: tenant.theme?.secondaryColor || "#0A1A2F",
                accentColor: tenant.theme?.accentColor || "#FFD700",
                logoUrl: tenant.theme?.logoUrl || "/images/goal-betting-logo.png",
                brandName: tenant.theme?.brandName || tenant.name,
                customCSS: tenant.theme?.customCSS || "",
              },
            },
          })
        }
      }
    }

    const url = new URL(request.url)
    const hostname = url.searchParams.get("hostname") || request.headers.get("host") || "localhost:3000"
    const tenantParam = url.searchParams.get("tenant")

    console.log("[v0] [Tenant API] Hostname from query:", hostname)
    console.log("[v0] [Tenant API] Tenant param:", tenantParam)

    let tenant = null

    if (tenantParam) {
      console.log("[v0] [Tenant API] Method 1: Looking up by URL param slug:", tenantParam)
      tenant = await Tenant.findOne({ slug: tenantParam, status: "active" }).lean()
      if (tenant) {
        console.log("[v0] [Tenant API] ✓ FOUND by URL param:", tenant.name)
      }
    }

    if (!tenant) {
      const hostWithoutPort = hostname.split(":")[0]
      const parts = hostWithoutPort.split(".")
      console.log("[v0] [Tenant API] Host without port:", hostWithoutPort)
      console.log("[v0] [Tenant API] Host parts:", JSON.stringify(parts))

      let subdomain = null

      if (parts.length >= 2 && parts[parts.length - 1] === "localhost" && parts[0] !== "localhost") {
        subdomain = parts[0]
        console.log("[v0] [Tenant API] Detected localhost subdomain:", subdomain)
      } else if (parts.length === 4 && parts[2] === "vercel" && parts[3] === "app") {
        const mainAppName = parts[1]
        const potentialSubdomain = parts[0]

        if (potentialSubdomain !== mainAppName && potentialSubdomain !== "www") {
          subdomain = potentialSubdomain
          console.log("[v0] [Tenant API] Detected Vercel subdomain:", subdomain)
        } else {
          console.log("[v0] [Tenant API] Main app domain, no subdomain")
        }
      } else if (parts.length === 3 && parts[1] === "vercel" && parts[2] === "app") {
        console.log("[v0] [Tenant API] Main Vercel app domain, no subdomain")
      } else if (parts.length >= 3) {
        const potentialSubdomain = parts[0]
        if (potentialSubdomain !== "www") {
          subdomain = potentialSubdomain
          console.log("[v0] [Tenant API] Detected custom domain subdomain:", subdomain)
        }
      }

      if (subdomain) {
        console.log("[v0] [Tenant API] Method 2: Looking up by subdomain slug:", subdomain)
        tenant = await Tenant.findOne({ slug: subdomain, status: "active" }).lean()
        if (tenant) {
          console.log("[v0] [Tenant API] ✓ FOUND by subdomain:", tenant.name)
        }
      }
    }

    if (!tenant) {
      console.log("[v0] [Tenant API] Method 3: Looking up by domain_list:", hostname)
      tenant = await Tenant.findOne({
        domain_list: { $elemMatch: { domain: hostname, isActive: true } },
        status: "active",
      }).lean()
      if (tenant) {
        console.log("[v0] [Tenant API] ✓ FOUND by domain_list:", tenant.name)
      }
    }

    if (!tenant) {
      console.log("[v0] [Tenant API] Method 4: Getting default provider tenant")
      tenant = await Tenant.findOne({ type: "provider", status: "active" }).lean()
      if (tenant) {
        console.log("[v0] [Tenant API] ✓ FOUND provider tenant:", tenant.name)
      }
    }

    if (!tenant) {
      console.log("[v0] [Tenant API] ✗ No tenant found, returning hardcoded default")
      return NextResponse.json({
        success: true,
        tenant: {
          name: "GoalBet",
          slug: "goalbet",
          type: "provider",
          designId: "classic",
          theme: {
            primaryColor: "#FFD700",
            secondaryColor: "#0A1A2F",
            accentColor: "#FFD700",
            logoUrl: "/images/goal-betting-logo.png",
            brandName: "GoalBet",
          },
        },
      })
    }

    console.log("[v0] [Tenant API] ========= RAW TENANT DATA =========")
    console.log("[v0] [Tenant API] tenant.name:", tenant.name)
    console.log("[v0] [Tenant API] tenant.designId:", tenant.designId)
    console.log("[v0] [Tenant API] tenant.theme (full object):", JSON.stringify(tenant.theme, null, 2))
    console.log("[v0] [Tenant API] tenant.theme?.logoUrl (raw):", tenant.theme?.logoUrl)
    console.log("[v0] [Tenant API] tenant.theme?.brandName (raw):", tenant.theme?.brandName)

    const theme = {
      primaryColor: tenant.theme?.primaryColor || "#FFD700",
      secondaryColor: tenant.theme?.secondaryColor || "#0A1A2F",
      accentColor: tenant.theme?.accentColor || "#FFD700",
      logoUrl:
        tenant.theme?.logoUrl && tenant.theme.logoUrl.trim() !== ""
          ? tenant.theme.logoUrl
          : "/images/goal-betting-logo.png",
      brandName: tenant.theme?.brandName && tenant.theme.brandName.trim() !== "" ? tenant.theme.brandName : tenant.name,
      customCSS: tenant.theme?.customCSS || "",
    }

    console.log("[v0] [Tenant API] ========= RETURNING TENANT =========")
    console.log("[v0] [Tenant API] Name:", tenant.name)
    console.log("[v0] [Tenant API] Slug:", tenant.slug)
    console.log("[v0] [Tenant API] DesignId:", tenant.designId || "classic")
    console.log("[v0] [Tenant API] Theme logoUrl (final):", theme.logoUrl)
    console.log("[v0] [Tenant API] Theme brandName (final):", theme.brandName)
    console.log("[v0] [Tenant API] Full Theme:", JSON.stringify(theme, null, 2))

    return NextResponse.json({
      success: true,
      tenant: {
        _id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        type: tenant.type,
        designId: tenant.designId || "classic",
        theme,
      },
    })
  } catch (error) {
    console.error("[v0] [Tenant API] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tenant",
      },
      { status: 500 },
    )
  }
}
