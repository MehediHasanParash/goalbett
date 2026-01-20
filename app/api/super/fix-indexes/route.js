import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"

export async function POST() {
  try {
    console.log("[v0] Starting database index fix...")

    // Connect to database
    await connectDB()
    console.log("[v0] Connected to database")

    // Get the User collection
    const collection = User.collection

    // Drop existing problematic indexes
    console.log("[v0] Dropping old indexes...")
    try {
      await collection.dropIndex("email_1")
      console.log("[v0] Dropped email_1 index")
    } catch (error) {
      console.log("[v0] email_1 index doesn't exist or already dropped")
    }

    try {
      await collection.dropIndex("phone_1")
      console.log("[v0] Dropped phone_1 index")
    } catch (error) {
      console.log("[v0] phone_1 index doesn't exist or already dropped")
    }

    try {
      await collection.dropIndex("username_1")
      console.log("[v0] Dropped username_1 index")
    } catch (error) {
      console.log("[v0] username_1 index doesn't exist or already dropped")
    }

    // Update all users to remove null and empty string values
    console.log("[v0] Cleaning up null and empty values...")
    const updateResult = await collection.updateMany(
      {
        $or: [{ email: null }, { email: "" }, { phone: null }, { phone: "" }, { username: null }, { username: "" }],
      },
      {
        $unset: {
          email: "",
          phone: "",
          username: "",
        },
      },
    )
    console.log(`[v0] Cleaned up ${updateResult.modifiedCount} user documents`)

    // Recreate sparse unique indexes
    console.log("[v0] Creating new sparse unique indexes...")
    await collection.createIndex({ email: 1 }, { unique: true, sparse: true })
    console.log("[v0] Created email sparse unique index")

    await collection.createIndex({ phone: 1 }, { unique: true, sparse: true })
    console.log("[v0] Created phone sparse unique index")

    await collection.createIndex({ username: 1 }, { unique: true, sparse: true })
    console.log("[v0] Created username sparse unique index")

    console.log("[v0] Database index fix completed successfully!")

    return NextResponse.json({
      success: true,
      message: "Database indexes fixed successfully",
      details: {
        documentsUpdated: updateResult.modifiedCount,
        indexesRecreated: ["email_1", "phone_1", "username_1"],
      },
    })
  } catch (error) {
    console.error("[v0] Error fixing database indexes:", error)
    return NextResponse.json({ error: "Failed to fix database indexes", details: error.message }, { status: 500 })
  }
}
