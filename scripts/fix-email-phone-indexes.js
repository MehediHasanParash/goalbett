const mongoose = require("mongoose")
const dotenv = require("dotenv")

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/test"

async function fixEmailPhoneIndexes() {
  try {
    console.log("[v0] Connecting to MongoDB...")
    await mongoose.connect(MONGODB_URI)
    console.log("[v0] Connected successfully")

    const db = mongoose.connection.db
    const usersCollection = db.collection("users")

    // Step 1: Drop the problematic indexes
    console.log("[v0] Dropping existing email, phone, and username indexes...")
    try {
      await usersCollection.dropIndex("email_1")
      console.log("[v0] Dropped email_1 index")
    } catch (error) {
      console.log("[v0] Email index might not exist:", error.message)
    }

    try {
      await usersCollection.dropIndex("phone_1")
      console.log("[v0] Dropped phone_1 index")
    } catch (error) {
      console.log("[v0] Phone index might not exist:", error.message)
    }

    try {
      await usersCollection.dropIndex("username_1")
      console.log("[v0] Dropped username_1 index")
    } catch (error) {
      console.log("[v0] Username index might not exist:", error.message)
    }

    // Step 2: Remove null email, phone, and username fields from existing documents
    console.log("[v0] Cleaning up null email fields...")
    const emailResult = await usersCollection.updateMany({ email: null }, { $unset: { email: "" } })
    console.log(`[v0] Removed email field from ${emailResult.modifiedCount} documents`)

    console.log("[v0] Cleaning up null phone fields...")
    const phoneResult = await usersCollection.updateMany({ phone: null }, { $unset: { phone: "" } })
    console.log(`[v0] Removed phone field from ${phoneResult.modifiedCount} documents`)

    console.log("[v0] Cleaning up null username fields...")
    const usernameResult = await usersCollection.updateMany({ username: null }, { $unset: { username: "" } })
    console.log(`[v0] Removed username field from ${usernameResult.modifiedCount} documents`)

    console.log("[v0] Cleaning up empty string email fields...")
    const emailEmptyResult = await usersCollection.updateMany({ email: "" }, { $unset: { email: "" } })
    console.log(`[v0] Removed email field from ${emailEmptyResult.modifiedCount} documents`)

    console.log("[v0] Cleaning up empty string phone fields...")
    const phoneEmptyResult = await usersCollection.updateMany({ phone: "" }, { $unset: { phone: "" } })
    console.log(`[v0] Removed phone field from ${phoneEmptyResult.modifiedCount} documents`)

    console.log("[v0] Cleaning up empty string username fields...")
    const usernameEmptyResult = await usersCollection.updateMany({ username: "" }, { $unset: { username: "" } })
    console.log(`[v0] Removed username field from ${usernameEmptyResult.modifiedCount} documents`)

    // Step 3: Recreate sparse unique indexes
    console.log("[v0] Creating new sparse unique indexes...")

    await usersCollection.createIndex({ email: 1 }, { unique: true, sparse: true, name: "email_1" })
    console.log("[v0] Created sparse unique index on email")

    await usersCollection.createIndex({ phone: 1 }, { unique: true, sparse: true, name: "phone_1" })
    console.log("[v0] Created sparse unique index on phone")

    await usersCollection.createIndex({ username: 1 }, { unique: true, sparse: true, name: "username_1" })
    console.log("[v0] Created sparse unique index on username")

    console.log("[v0] ✅ Successfully fixed email/phone/username indexes!")
    console.log("[v0] You can now create players without email/phone fields")
  } catch (error) {
    console.error("[v0] ❌ Error fixing indexes:", error)
  } finally {
    await mongoose.connection.close()
    console.log("[v0] Database connection closed")
  }
}

fixEmailPhoneIndexes()
