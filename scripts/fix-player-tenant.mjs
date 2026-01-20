import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'

// Function to clean MongoDB URI
function cleanMongoUri(uri) {
  if (!uri) return null
  
  // Remove quotes and trim
  uri = uri.replace(/['"]/g, '').trim()
  
  // Split into base and query params
  const [base, queryString] = uri.split('?')
  
  if (!queryString) return uri
  
  // Parse and filter params
  const params = queryString.split('&')
    .filter(param => {
      const [key, value] = param.split('=')
      return key && value && value.length > 0
    })
  
  return params.length > 0 ? `${base}?${params.join('&')}` : base
}

// Load MongoDB URI from .env.local
function loadMongoUri() {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf-8')
    const lines = envContent.split('\n')
    
    for (const line of lines) {
      if (line.trim().startsWith('MONGODB_URI=')) {
        const uri = line.split('=')[1].trim()
        return cleanMongoUri(uri)
      }
    }
  } catch (error) {
    console.error('Error loading .env.local:', error.message)
  }
  return null
}

async function fixPlayerTenants() {
  try {
    const mongoUri = loadMongoUri()
    
    if (!mongoUri) {
      console.error('Could not load MongoDB URI from .env.local')
      process.exit(1)
    }
    
    console.log('Cleaned MongoDB URI loaded from .env.local')
    console.log('Connecting to database...')
    
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')
    
    // Define schemas
    const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' })
    const User = mongoose.model('User', userSchema)
    
    const tenantSchema = new mongoose.Schema({}, { strict: false, collection: 'tenants' })
    const Tenant = mongoose.model('Tenant', tenantSchema)
    
    // List all tenants
    const tenants = await Tenant.find({})
    console.log('\n=== Available Tenants ===')
    tenants.forEach(tenant => {
      console.log(`- ${tenant.name} (ID: ${tenant._id})`)
    })
    
    // Find all players
    const allPlayers = await User.find({ role: 'player' })
    console.log(`\n=== Found ${allPlayers.length} total players ===`)
    
    // Group by tenant
    const playersByTenant = {}
    const playersWithoutTenant = []
    
    allPlayers.forEach(player => {
      if (player.tenant_id) {
        const tenantId = player.tenant_id.toString()
        if (!playersByTenant[tenantId]) {
          playersByTenant[tenantId] = []
        }
        playersByTenant[tenantId].push(player)
      } else {
        playersWithoutTenant.push(player)
      }
    })
    
    // Display distribution
    console.log('\n=== Player Distribution by Tenant ===')
    for (const [tenantId, players] of Object.entries(playersByTenant)) {
      const tenant = tenants.find(t => t._id.toString() === tenantId)
      const tenantName = tenant ? tenant.name : 'Unknown'
      console.log(`${tenantName} (${tenantId}): ${players.length} players`)
      players.slice(0, 3).forEach(p => {
        console.log(`  - ${p.username || p.email || p.phone}`)
      })
      if (players.length > 3) {
        console.log(`  ... and ${players.length - 3} more`)
      }
    }
    
    if (playersWithoutTenant.length > 0) {
      console.log(`\nPlayers without tenant: ${playersWithoutTenant.length}`)
      playersWithoutTenant.slice(0, 3).forEach(p => {
        console.log(`  - ${p.username || p.email || p.phone}`)
      })
    }
    
    // Update all players to Amnen Bet tenant
    const amnenBetTenantId = '693414c154952e7982a0fb67'
    
    console.log(`\n=== Updating ALL players to Amnen Bet tenant (${amnenBetTenantId}) ===`)
    
    const result = await User.updateMany(
      { role: 'player' },
      { $set: { tenant_id: new mongoose.Types.ObjectId(amnenBetTenantId) } }
    )
    
    console.log(`\nUpdated ${result.modifiedCount} players to Amnen Bet tenant`)
    
    // Verify
    const verifyPlayers = await User.find({ 
      role: 'player',
      tenant_id: new mongoose.Types.ObjectId(amnenBetTenantId)
    })
    
    console.log(`\nVerification: ${verifyPlayers.length} players now belong to Amnen Bet`)
    
    await mongoose.connection.close()
    console.log('\nDatabase connection closed')
    process.exit(0)
    
  } catch (error) {
    console.error('Error fixing player tenants:', error)
    process.exit(1)
  }
}

fixPlayerTenants()
