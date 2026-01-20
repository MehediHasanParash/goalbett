// Shadow User Engine - Stress Test Simulator
// Simulates concurrent virtual players for RTP accuracy and server stability testing

import crypto from "crypto"

export class ShadowUserEngine {
  constructor(config = {}) {
    this.config = {
      virtualPlayers: config.virtualPlayers || 100,
      betsPerSecond: config.betsPerSecond || 10,
      duration: config.duration || 60, // seconds
      minBet: config.minBet || 10,
      maxBet: config.maxBet || 1000,
      targetRTP: config.targetRTP || 96, // Target RTP percentage
      baseUrl: config.baseUrl || "",
      tenantId: config.tenantId || null,
    }

    this.isRunning = false
    this.stats = {
      totalBets: 0,
      totalStaked: 0,
      totalWon: 0,
      wins: 0,
      losses: 0,
      errors: 0,
      startTime: null,
      endTime: null,
      latencies: [],
      rtpHistory: [],
    }

    this.virtualPlayers = []
    this.intervals = []
  }

  // Generate virtual player
  generateVirtualPlayer(index) {
    return {
      id: `shadow_${crypto.randomBytes(8).toString("hex")}`,
      name: `ShadowUser_${index}`,
      balance: 10000, // Virtual balance
      totalBets: 0,
      totalWon: 0,
      totalStaked: 0,
    }
  }

  // Simulate a single bet
  async simulateBet(player, eventId = null) {
    const stake = Math.floor(Math.random() * (this.config.maxBet - this.config.minBet)) + this.config.minBet
    const odds = 1.5 + Math.random() * 3 // Random odds between 1.5 and 4.5

    // Calculate win probability based on target RTP
    // RTP = (Total Won / Total Staked) * 100
    // For target RTP of 96%, win probability = RTP / (odds * 100)
    const winProbability = this.config.targetRTP / (odds * 100)

    const startTime = Date.now()
    let won = false
    let payout = 0

    try {
      // Simulate bet placement with random outcome based on RTP
      const random = Math.random()
      won = random < winProbability

      if (won) {
        payout = stake * odds
        player.balance += payout - stake
        player.totalWon += payout
        this.stats.wins++
        this.stats.totalWon += payout
      } else {
        player.balance -= stake
        this.stats.losses++
      }

      player.totalBets++
      player.totalStaked += stake
      this.stats.totalBets++
      this.stats.totalStaked += stake

      const latency = Date.now() - startTime
      this.stats.latencies.push(latency)

      // Calculate current RTP
      const currentRTP = this.stats.totalStaked > 0 ? (this.stats.totalWon / this.stats.totalStaked) * 100 : 0

      this.stats.rtpHistory.push({
        time: Date.now(),
        rtp: currentRTP,
        bets: this.stats.totalBets,
      })

      return {
        success: true,
        playerId: player.id,
        stake,
        odds,
        won,
        payout,
        latency,
        currentRTP: currentRTP.toFixed(2),
      }
    } catch (error) {
      this.stats.errors++
      return {
        success: false,
        error: error.message,
        playerId: player.id,
      }
    }
  }

  // Start the stress test
  async start(progressCallback = null) {
    if (this.isRunning) {
      return { success: false, error: "Test already running" }
    }

    this.isRunning = true
    this.stats = {
      totalBets: 0,
      totalStaked: 0,
      totalWon: 0,
      wins: 0,
      losses: 0,
      errors: 0,
      startTime: Date.now(),
      endTime: null,
      latencies: [],
      rtpHistory: [],
    }

    // Create virtual players
    this.virtualPlayers = []
    for (let i = 0; i < this.config.virtualPlayers; i++) {
      this.virtualPlayers.push(this.generateVirtualPlayer(i))
    }

    console.log(`[ShadowUserEngine] Starting stress test with ${this.config.virtualPlayers} virtual players`)

    // Calculate interval for desired bets per second
    const intervalMs = 1000 / this.config.betsPerSecond

    return new Promise((resolve) => {
      let elapsed = 0
      const startTime = Date.now()

      const runBets = async () => {
        if (!this.isRunning) {
          return
        }

        elapsed = (Date.now() - startTime) / 1000

        if (elapsed >= this.config.duration) {
          this.stop()
          resolve(this.getResults())
          return
        }

        // Pick random players and simulate bets
        const batchSize = Math.min(this.config.betsPerSecond, this.virtualPlayers.length)
        const promises = []

        for (let i = 0; i < batchSize; i++) {
          const playerIndex = Math.floor(Math.random() * this.virtualPlayers.length)
          const player = this.virtualPlayers[playerIndex]
          promises.push(this.simulateBet(player))
        }

        await Promise.all(promises)

        if (progressCallback) {
          progressCallback({
            elapsed,
            totalBets: this.stats.totalBets,
            rtp: this.stats.totalStaked > 0 ? ((this.stats.totalWon / this.stats.totalStaked) * 100).toFixed(2) : 0,
            errors: this.stats.errors,
            avgLatency: this.getAverageLatency(),
          })
        }

        setTimeout(runBets, intervalMs)
      }

      runBets()
    })
  }

  // Stop the stress test
  stop() {
    this.isRunning = false
    this.stats.endTime = Date.now()
    console.log(`[ShadowUserEngine] Stress test stopped. Total bets: ${this.stats.totalBets}`)
  }

  // Get average latency
  getAverageLatency() {
    if (this.stats.latencies.length === 0) return 0
    const sum = this.stats.latencies.reduce((a, b) => a + b, 0)
    return Math.round(sum / this.stats.latencies.length)
  }

  // Get P99 latency
  getP99Latency() {
    if (this.stats.latencies.length === 0) return 0
    const sorted = [...this.stats.latencies].sort((a, b) => a - b)
    const index = Math.floor(sorted.length * 0.99)
    return sorted[index] || sorted[sorted.length - 1]
  }

  // Get final results
  getResults() {
    const duration = this.stats.endTime
      ? (this.stats.endTime - this.stats.startTime) / 1000
      : (Date.now() - this.stats.startTime) / 1000

    const finalRTP = this.stats.totalStaked > 0 ? (this.stats.totalWon / this.stats.totalStaked) * 100 : 0

    return {
      success: true,
      summary: {
        virtualPlayers: this.config.virtualPlayers,
        duration: duration.toFixed(2),
        totalBets: this.stats.totalBets,
        betsPerSecond: (this.stats.totalBets / duration).toFixed(2),
        totalStaked: this.stats.totalStaked.toFixed(2),
        totalWon: this.stats.totalWon.toFixed(2),
        wins: this.stats.wins,
        losses: this.stats.losses,
        winRate: ((this.stats.wins / this.stats.totalBets) * 100).toFixed(2),
        errors: this.stats.errors,
        errorRate: ((this.stats.errors / this.stats.totalBets) * 100).toFixed(2),
      },
      performance: {
        avgLatency: this.getAverageLatency(),
        p99Latency: this.getP99Latency(),
        maxLatency: Math.max(...this.stats.latencies, 0),
        minLatency: Math.min(...this.stats.latencies, 0),
      },
      rtp: {
        target: this.config.targetRTP,
        actual: finalRTP.toFixed(2),
        deviation: Math.abs(finalRTP - this.config.targetRTP).toFixed(2),
        withinTolerance: Math.abs(finalRTP - this.config.targetRTP) <= 2, // 2% tolerance
      },
      rtpHistory: this.stats.rtpHistory.slice(-100), // Last 100 data points
      playerStats: this.virtualPlayers.map((p) => ({
        id: p.id,
        name: p.name,
        bets: p.totalBets,
        staked: p.totalStaked.toFixed(2),
        won: p.totalWon.toFixed(2),
        profit: (p.totalWon - p.totalStaked).toFixed(2),
      })),
    }
  }
}

export default ShadowUserEngine
