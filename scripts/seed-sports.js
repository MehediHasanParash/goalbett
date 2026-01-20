// Seed script to populate sports database
import { MOCK_SPORTS, MOCK_LEAGUES, MOCK_EVENTS } from "../lib/mock-data/sports.js"

console.log("🌱 Seeding sports database...")
console.log(`📊 Sports: ${MOCK_SPORTS.length}`)
console.log(`🏆 Leagues: ${MOCK_LEAGUES.length}`)
console.log(`⚽ Events: ${MOCK_EVENTS.length}`)

// This script will be executed by calling the seed API endpoint
const response = await fetch("/api/super/sports/seed", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
})

const result = await response.json()
console.log("✅ Seed complete:", result)
