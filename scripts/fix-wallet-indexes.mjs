import mongoose from "mongoose"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load MongoDB URI from .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, "..", ".env.local")
    const envContent = fs.readFileSync(envPath, "utf8")
    const lines = envContent.split("\n")

    for (const line of lines) {
      if (line.startsWith("MONGODB_URI=")) {
        let uri = line.substring("MONGODB_URI=".length).trim()
        // Remove quotes if present
        uri = uri.replace(/^["']|["']$/g, "")
        // Clean up the URI
        uri = cleanMongoURI(uri)
        return uri
      }
    }
    throw new Error("MONGODB_URI not found in .env.local")
  } catch (error) {
    console.error("Error loading .env.local:", error.message)
    throw error
  }
}

function cleanMongoURI(uri) {
  if (!uri.includes("?")) return uri

  const [base, query] = uri.split("?")
  const params = query
    .split("&")
    .filter((param) => {
      const [key, value] = param.split("=")
      return value && value.trim() !== ""
    })
    .join("&")

  return params ? `${base}?${params}` : base
}

console.log("Fix Wallet Indexes Script Started")

async function fixWalletIndexes() {
  console.log("Starting wallet indexes fix...")
  console.log("Loading MongoDB URI from .env.local...")
  
  try {
    const mongoURI = loadEnvFile()
    console.log("Cleaned MongoDB URI loaded from .env.local")
    console.log("Connecting to MongoDB...")

    await mongoose.connect(mongoURI)
    console.log("Connected to MongoDB")

    const db = mongoose.connection.db
    const walletsCollection = db.collection("wallets")

    // Get current indexes
    const indexes = await walletsCollection.indexes()
    console.log("\nCurrent wallet indexes:")
    indexes.forEach((idx) => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key))
    })

    // Drop problematic compound index if it exists
    const compoundIndexName = "tenantId_1_userId_1"
    const hasCompoundIndex = indexes.some((idx) => idx.name === compoundIndexName)

    if (hasCompoundIndex) {
      console.log(`\nDropping problematic index: ${compoundIndexName}`)
      await walletsCollection.dropIndex(compoundIndexName)
      console.log("✓ Index dropped successfully")
    } else {
      console.log(`\nIndex ${compoundIndexName} does not exist, skipping drop`)
    }

    const userIdIndexName = "userId_1"
    const hasUserIdIndex = indexes.some((idx) => idx.name === userIdIndexName)

    if (hasUserIdIndex) {
      console.log(`\nDropping existing userId index: ${userIdIndexName}`)
      await walletsCollection.dropIndex(userIdIndexName)
      console.log("✓ userId index dropped successfully")
    } else {
      console.log(`\nIndex ${userIdIndexName} does not exist, skipping drop`)
    }

    // Create new sparse index on userId that allows multiple nulls
    console.log("\nCreating new sparse index on userId...")
    await walletsCollection.createIndex({ userId: 1 }, { sparse: true, name: "userId_1_sparse" })
    console.log("✓ Sparse userId index created")

    // Create index on tenantId
    console.log("\nCreating index on tenantId...")
    await walletsCollection.createIndex({ tenantId: 1 })
    console.log("✓ tenantId index created")

    // Verify new indexes
    const newIndexes = await walletsCollection.indexes()
    console.log("\nNew wallet indexes:")
    newIndexes.forEach((idx) => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key))
    })

    console.log("\n✅ Wallet indexes fixed successfully!")
    console.log("\nYou can now create wallets for multiple tenants without duplicate key errors.")

    await mongoose.connection.close()
    console.log("\nDatabase connection closed")
  } catch (error) {
    console.error("\n❌ Error fixing wallet indexes:", error)
    console.error("Error stack:", error.stack)
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close()
    }
    process.exit(1)
  }
}

fixWalletIndexes().catch((error) => {
  console.error("Unhandled error:", error)
  process.exit(1)
})
