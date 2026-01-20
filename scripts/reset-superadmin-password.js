require("dotenv").config({ path: ".env.local" })
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

//pass Admin@123

async function resetSuperAdminPassword() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI

    if (!MONGODB_URI) {
      console.error("[v0] Error: MONGODB_URI environment variable is not set")
      console.log("[v0] Make sure you have a .env.local file with MONGODB_URI or pass it directly:")
      console.log("[v0] MONGODB_URI='your-connection-string' node scripts/reset-superadmin-password.js")
      process.exit(1)
    }

    console.log("[v0] Connecting to MongoDB...")
    await mongoose.connect(MONGODB_URI)
    console.log("[v0] Connected to MongoDB")

    const email = "super@gmail.com"
    const newPassword = "Admin@123"

    // Hash the new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    console.log("[v0] Resetting password for:", email)
    console.log("[v0] New password hash length:", hashedPassword.length)

    // Update directly using MongoDB driver to bypass Mongoose
    const result = await mongoose.connection.db.collection("users").findOneAndUpdate(
      { email: email, role: "superadmin" },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    if (result) {
      console.log("[v0] Password reset successful!")
      console.log("[v0] User ID:", result._id)
      console.log("[v0] Email:", result.email)
      console.log("[v0] New password is: Admin@123")
    } else {
      console.log("[v0] User not found!")
    }

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error("[v0] Error:", error)
    process.exit(1)
  }
}

resetSuperAdminPassword()
