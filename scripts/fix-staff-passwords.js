// Script to fix double-hashed staff passwords
// Run this once to reset all staff passwords to a known value

require("dotenv").config({ path: ".env.local" })

const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const staffRoles = ["finance_manager", "general_manager", "support_manager", "support_agent"]

async function fixStaffPasswords() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/goal-bett"

    console.log("Connecting to database...")
    await mongoose.connect(MONGODB_URI)
    console.log("Connected to database")

    // Get the User collection directly
    const User = mongoose.connection.collection("users")

    // Find all staff members
    const staffMembers = await User.find({
      role: { $in: staffRoles },
    }).toArray()

    console.log(`Found ${staffMembers.length} staff members`)

    const tempPassword = "staff123"
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    for (const staff of staffMembers) {
      await User.updateOne({ _id: staff._id }, { $set: { password: hashedPassword } })
      console.log(`Reset password for ${staff.email} (${staff.role})`)
    }

    console.log(`\nAll staff passwords have been reset to: ${tempPassword}`)
    console.log("Please ask staff members to change their passwords after logging in.")

    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error("Error fixing passwords:", error)
    process.exit(1)
  }
}

fixStaffPasswords()
