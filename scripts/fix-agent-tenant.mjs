import mongoose from "mongoose"
import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = resolve(__dirname, "../.env.local")

let MONGODB_URI = "mongodb://localhost:27017/your-database"

try {
  const envFile = readFileSync(envPath, "utf8")
  const envVars = envFile.split("\n")
  for (const line of envVars) {
    if (line.startsWith("MONGODB_URI=")) {
      MONGODB_URI = line.split("=").slice(1).join("=").trim()
      // Remove quotes if present
      MONGODB_URI = MONGODB_URI.replace(/^["']|["']$/g, "")
      
      // Split URI into base and query params
      const [baseUri, queryString] = MONGODB_URI.split("?")
      if (queryString) {
        // Filter out empty parameters
        const validParams = queryString
          .split("&")
          .filter(param => {
            const [key, value] = param.split("=")
            return key && value && value.trim() !== ""
          })
        
        // Reconstruct URI with only valid parameters
        MONGODB_URI = validParams.length > 0 
          ? `${baseUri}?${validParams.join("&")}`
          : baseUri
      }
      
      console.log("Cleaned MongoDB URI loaded from .env.local")
      break
    }
  }
} catch (error) {
  console.warn("Could not read .env.local, using default MongoDB URI")
  console.log("Please ensure your MongoDB is running or update the MONGODB_URI in the script")
}

// Define schemas inline to avoid module import issues
const userSchema = new mongoose.Schema({}, { strict: false })
const tenantSchema = new mongoose.Schema({}, { strict: false })

async function fixAgentTenants() {
  try {
    console.log("Connecting to database...")
    await mongoose.connect(MONGODB_URI)
    console.log("Connected to MongoDB")

    const User = mongoose.model("User", userSchema)
    const Tenant = mongoose.model("Tenant", tenantSchema)

    const allAgents = await User.find({
      role: { $in: ["agent", "sub_agent"] }
    })

    console.log(`Found ${allAgents.length} agent(s) in total`)

    if (allAgents.length === 0) {
      console.log("No agents found in database")
      await mongoose.connection.close()
      process.exit(0)
    }

    const correctTenantId = "693414c154952e7982a0fb67"
    const amnenBetTenant = await Tenant.findById(correctTenantId)
    
    if (!amnenBetTenant) {
      console.error(`Tenant with ID ${correctTenantId} not found in database!`)
      await mongoose.connection.close()
      process.exit(1)
    }

    console.log(`\nReassigning ALL agents to tenant: ${amnenBetTenant.name} (ID: ${correctTenantId})`)

    // Update ALL agents to the correct Amnen Bet tenant
    const result = await User.updateMany(
      {
        role: { $in: ["agent", "sub_agent"] }
      },
      {
        $set: { tenant_id: correctTenantId }
      }
    )

    console.log(`\nSuccess! Updated ${result.modifiedCount} agent(s) with tenant_id: ${correctTenantId}`)
    console.log("\nVerifying update...")

    // Verify the update
    const updatedAgents = await User.find({
      role: { $in: ["agent", "sub_agent"] },
      tenant_id: correctTenantId
    }).select("username email role tenant_id")

    console.log("\nUpdated agents:")
    updatedAgents.forEach(agent => {
      console.log(`  - ${agent.username || agent.email} (${agent.email}) - Role: ${agent.role}, Tenant ID: ${agent.tenant_id}`)
    })

    await mongoose.connection.close()
    console.log("\nDatabase connection closed. Migration complete!")
    process.exit(0)
  } catch (error) {
    console.error("Error fixing agent tenants:", error)
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close()
    }
    process.exit(1)
  }
}

fixAgentTenants()
