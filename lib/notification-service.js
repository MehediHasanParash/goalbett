import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local")
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

let modelsRegistered = false

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("[v0] MongoDB connected successfully")

      if (!modelsRegistered) {
        registerModels()
        modelsRegistered = true
      }

      return mongoose
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

function registerModels() {
  // Import all models to ensure they're registered with Mongoose
  // This prevents "Schema hasn't been registered" errors in production
  try {
    require("./models/User")
    require("./models/Tenant")
    require("./models/TenantConfig")
    require("./models/AuditLog")
    require("./models/GuestSession")
    require("./models/Wallet")
    require("./models/Transaction")
    require("./models/Sport")
    require("./models/League")
    require("./models/Event")
    require("./models/Market")
    require("./models/Bet")
    require("./models/BetSlip")
    require("./models/Mission")
    require("./models/Leaderboard")
    require("./models/Friend")
    require("./models/SupportTicket")
    console.log("[v0] All models registered successfully")
  } catch (error) {
    console.error("[v0] Error registering models:", error)
  }
}

export { connectDB }
export { connectDB as connectToDatabase }
export default connectDB
