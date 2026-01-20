import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local")
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

let modelsRegistering = false

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongooseInstance) => {
      console.log("[v0] MongoDB connected successfully")

      if (!modelsRegistering) {
        modelsRegistering = true
        await registerModels()
      }

      return mongooseInstance
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

async function registerModels() {
  try {
    console.log("[v0] Registering all models...")

    // Import all models in the correct dependency order
    // Base models first (no dependencies)
    await import("./models/User.js")
    await import("./models/Tenant.js")
    await import("./models/TenantConfig.js")
    await import("./models/AuditLog.js")
    await import("./models/GuestSession.js")
    await import("./models/Wallet.js")
    await import("./models/Transaction.js")
    await import("./models/Sport.js")

    // Models that depend on Sport
    await import("./models/League.js")

    // Models that depend on Sport, League, etc.
    await import("./models/Event.js")
    await import("./models/Market.js")
    await import("./models/Bet.js")
    await import("./models/BetSlip.js")
    await import("./models/Mission.js")
    await import("./models/Leaderboard.js")
    await import("./models/Friend.js")
    await import("./models/SupportTicket.js")

    console.log("[v0] All models registered successfully")
  } catch (error) {
    console.error("[v0] Error registering models:", error)
    // Don't throw - allow the app to continue
  }
}

export { connectDB }
export { connectDB as connectToDatabase }
export default connectDB
