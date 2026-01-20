// Shadow User Engine API - Stress Test Simulator
import { NextResponse } from "next/server"
import { ShadowUserEngine } from "@/lib/services/shadow-user-engine"

// Store running test instance
let runningTest = null

// POST - Start a new stress test
export async function POST(request) {
  try {
    if (runningTest && runningTest.isRunning) {
      return NextResponse.json({ success: false, error: "A test is already running" }, { status: 400 })
    }

    const body = await request.json()

    const config = {
      virtualPlayers: Math.min(body.virtualPlayers || 100, 10000), // Max 10,000
      betsPerSecond: Math.min(body.betsPerSecond || 10, 1000), // Max 1000/sec
      duration: Math.min(body.duration || 60, 3600), // Max 1 hour
      minBet: body.minBet || 10,
      maxBet: body.maxBet || 1000,
      targetRTP: body.targetRTP || 96,
      tenantId: body.tenantId || null,
    }

    console.log("[ShadowUserEngine] Starting stress test with config:", config)

    runningTest = new ShadowUserEngine(config)

    // Start the test asynchronously
    const resultsPromise = runningTest.start()

    // Return immediately with test started confirmation
    return NextResponse.json({
      success: true,
      message: "Stress test started",
      config,
      estimatedBets: config.virtualPlayers * config.betsPerSecond * config.duration,
    })
  } catch (error) {
    console.error("[ShadowUserEngine] Error starting test:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// GET - Get current test status/results
export async function GET(request) {
  try {
    if (!runningTest) {
      return NextResponse.json({
        success: true,
        status: "idle",
        message: "No stress test has been run yet",
      })
    }

    if (runningTest.isRunning) {
      // Return current progress
      const progress = {
        success: true,
        status: "running",
        progress: {
          totalBets: runningTest.stats.totalBets,
          totalStaked: runningTest.stats.totalStaked,
          totalWon: runningTest.stats.totalWon,
          wins: runningTest.stats.wins,
          losses: runningTest.stats.losses,
          errors: runningTest.stats.errors,
          elapsed: (Date.now() - runningTest.stats.startTime) / 1000,
          rtp:
            runningTest.stats.totalStaked > 0
              ? ((runningTest.stats.totalWon / runningTest.stats.totalStaked) * 100).toFixed(2)
              : 0,
          avgLatency: runningTest.getAverageLatency(),
        },
      }
      return NextResponse.json(progress)
    }

    // Return final results
    return NextResponse.json({
      success: true,
      status: "completed",
      results: runningTest.getResults(),
    })
  } catch (error) {
    console.error("[ShadowUserEngine] Error getting status:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - Stop running test
export async function DELETE(request) {
  try {
    if (!runningTest || !runningTest.isRunning) {
      return NextResponse.json({ success: false, error: "No test is running" }, { status: 400 })
    }

    runningTest.stop()

    return NextResponse.json({
      success: true,
      message: "Stress test stopped",
      results: runningTest.getResults(),
    })
  } catch (error) {
    console.error("[ShadowUserEngine] Error stopping test:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
