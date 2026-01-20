// Reset passwords for all users
// Run with: node scripts/reset-all-passwords.js

require("dotenv").config({ path: ".env.local" })
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

async function resetPasswords() {
  const MONGODB_URI = process.env.MONGODB_URI

  if (!MONGODB_URI) {
    console.error("MONGODB_URI not found in .env.local")
    process.exit(1)
  }

  try {
    console.log("Connecting to MongoDB...")
    await mongoose.connect(MONGODB_URI)
    console.log("Connected to MongoDB")

    const db = mongoose.connection.db
    const usersCollection = db.collection("users")

    // Define default passwords by role
    const defaultPasswords = {
      superadmin: "Admin@123",
      super_admin: "Admin@123",
      tenant_admin: "Tenant@123",
      admin: "Admin@123",
      agent: "Agent@123",
      sub_agent: "Agent@123",
      finance_manager: "Staff@123",
      general_manager: "Staff@123",
      support_manager: "Staff@123",
      support_agent: "Staff@123",
      player: "Player@123",
    }

    // Get all users
    const users = await usersCollection.find({}).toArray()
    console.log(`Found ${users.length} users`)

    let updated = 0
    for (const user of users) {
      const role = user.role || "player"
      const password = defaultPasswords[role] || "Password@123"

      // Hash the password
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)

      // Update the user directly in MongoDB
      await usersCollection.updateOne({ _id: user._id }, { $set: { password: hashedPassword } })

      console.log(`Reset password for ${user.email || user.username} (${role}) to: ${password}`)
      updated++
    }

    console.log(`\n✅ Reset passwords for ${updated} users`)
    console.log("\nDefault passwords by role:")
    console.log("  Super Admin: Admin@123")
    console.log("  Tenant Admin: Tenant@123")
    console.log("  Agent/Sub-Agent: Agent@123")
    console.log("  Staff: Staff@123")
    console.log("  Player: Player@123")

    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  }
}

resetPasswords()
