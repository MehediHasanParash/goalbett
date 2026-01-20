require("dotenv").config({ path: ".env.local" })
const mongoose = require("mongoose")

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI environment variable is not defined")
  process.exit(1)
}

// Define the Wallet schema inline
const walletSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    tenant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
    availableBalance: { type: Number, default: 0 },
    lockedBalance: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
  },
  { timestamps: true },
)

const Wallet = mongoose.models.Wallet || mongoose.model("Wallet", walletSchema)

async function updateWalletCurrency() {
  try {
    console.log("[v0] Connecting to MongoDB...")
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    })
    console.log("[v0] Connected successfully")

    console.log("[v0] Updating wallets with currency ETB to USD...")

    // Update all wallets with ETB currency to USD
    const result = await Wallet.updateMany({ currency: "ETB" }, { $set: { currency: "USD" } })

    console.log(`[v0] Successfully updated ${result.modifiedCount} wallet(s) from ETB to USD`)

    // Verify the update
    const usdWallets = await Wallet.countDocuments({ currency: "USD" })
    const etbWallets = await Wallet.countDocuments({ currency: "ETB" })
    console.log(`[v0] Total wallets with USD currency: ${usdWallets}`)
    console.log(`[v0] Total wallets with ETB currency: ${etbWallets}`)

    await mongoose.connection.close()
    console.log("[v0] Database connection closed")
    process.exit(0)
  } catch (error) {
    console.error("[v0] Error updating wallet currency:", error)
    process.exit(1)
  }
}

updateWalletCurrency()
