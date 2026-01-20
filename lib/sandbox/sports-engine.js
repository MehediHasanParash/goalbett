import Event from "@/lib/models/Event"
import Bet from "@/lib/models/Bet"
import Sport from "@/lib/models/Sport"
import League from "@/lib/models/League"
import { LedgerEngine } from "@/lib/ledger-engine"
import { logAudit } from "@/lib/audit-logger"

// Default betting limits (can be overridden per tenant)
const DEFAULT_LIMITS = {
  minStake: 1,
  maxStake: 100000,
  maxWinning: 500000, // Maximum potential winning per slip
  maxSelectionsPerSlip: 100,
  minOdds: 1.01,
  maxOdds: 1000,
  maxOddsPerSelection: 100,
}

/**
 * Sandbox Sports Engine
 * Handles all sports betting logic without external API dependencies
 */
export class SandboxSportsEngine {
  /**
   * Get tenant-specific betting limits
   */
  static async getLimits(tenantId) {
    // In production, fetch from TenantConfig
    // For sandbox, use defaults
    return DEFAULT_LIMITS
  }

  /**
   * Get or create default sport for sandbox
   * @param {string} sportSlug - Sport slug (e.g., 'football', 'basketball')
   * @returns {Promise<ObjectId>} Sport ObjectId
   */
  static async ensureSport(sportSlug = "football") {
    const sportMap = {
      football: { name: "Football", slug: "football", icon: "⚽" },
      basketball: { name: "Basketball", slug: "basketball", icon: "🏀" },
      tennis: { name: "Tennis", slug: "tennis", icon: "🎾" },
      cricket: { name: "Cricket", slug: "cricket", icon: "🏏" },
    }

    const sportData = sportMap[sportSlug] || sportMap.football

    let sport = await Sport.findOne({ slug: sportData.slug })

    if (!sport) {
      sport = await Sport.create({
        name: sportData.name,
        slug: sportData.slug,
        icon: sportData.icon,
        isActive: true,
        category: "sports",
        availableMarkets: ["match_winner", "over_under", "both_teams_score", "double_chance"],
      })
    }

    return sport._id
  }

  /**
   * Get or create default league for sandbox
   * @param {ObjectId} sportId - Sport ObjectId
   * @param {string} leagueSlug - League slug (e.g., 'premier-league')
   * @returns {Promise<ObjectId>} League ObjectId
   */
  static async ensureLeague(sportId, leagueSlug = "premier-league") {
    const leagueMap = {
      "premier-league": { name: "Premier League", country: "England", countryCode: "GB" },
      "la-liga": { name: "La Liga", country: "Spain", countryCode: "ES" },
      "serie-a": { name: "Serie A", country: "Italy", countryCode: "IT" },
      bundesliga: { name: "Bundesliga", country: "Germany", countryCode: "DE" },
      nba: { name: "NBA", country: "USA", countryCode: "US" },
      atp: { name: "ATP Tour", country: "International", countryCode: "INT" },
    }

    const leagueData = leagueMap[leagueSlug] || leagueMap["premier-league"]

    let league = await League.findOne({ slug: leagueSlug, sportId })

    if (!league) {
      league = await League.create({
        name: leagueData.name,
        slug: leagueSlug,
        sportId,
        country: leagueData.country,
        countryCode: leagueData.countryCode,
        isActive: true,
        isFeatured: true,
        order: 1,
      })
    }

    return league._id
  }

  /**
   * Create a demo event (match)
   * @param {Object} params - Event parameters
   * @returns {Promise<Object>} Created event
   */
  static async createDemoEvent({
    tenantId,
    sportId,
    leagueId,
    homeTeam,
    awayTeam,
    startTime,
    odds = {},
    markets = {},
    createdBy,
  }) {
    let finalSportId = sportId
    let finalLeagueId = leagueId

    // If sportId is a string (slug), find or create the sport
    if (typeof sportId === "string") {
      finalSportId = await this.ensureSport(sportId)
    }

    // If leagueId is a string (slug), find or create the league
    if (typeof leagueId === "string") {
      finalLeagueId = await this.ensureLeague(finalSportId, leagueId)
    }

    const event = await Event.create({
      name: `${homeTeam.name} vs ${awayTeam.name}`,
      sportId: finalSportId,
      leagueId: finalLeagueId,
      homeTeam: {
        name: homeTeam.name,
        logo: homeTeam.logo || "",
        score: null,
      },
      awayTeam: {
        name: awayTeam.name,
        logo: awayTeam.logo || "",
        score: null,
      },
      startTime: new Date(startTime),
      status: "scheduled",
      isBettingOpen: true,
      odds: {
        home: odds.home || 2.0,
        draw: odds.draw || 3.5,
        away: odds.away || 3.0,
      },
      markets: {
        overUnder: {
          line: markets.overUnder?.line || 2.5,
          over: markets.overUnder?.over || 1.85,
          under: markets.overUnder?.under || 1.95,
        },
        bothTeamsScore: {
          yes: markets.bothTeamsScore?.yes || 1.75,
          no: markets.bothTeamsScore?.no || 2.05,
        },
        doubleChance: {
          homeOrDraw: markets.doubleChance?.homeOrDraw || 1.35,
          homeOrAway: markets.doubleChance?.homeOrAway || 1.25,
          drawOrAway: markets.doubleChance?.drawOrAway || 1.55,
        },
      },
      metadata: {
        isSandbox: true,
        createdBy,
        venue: `${homeTeam.name} Stadium`,
      },
    })

    // Audit log
    await logAudit({
      action: "sandbox_event_created",
      performedBy: createdBy,
      targetType: "event",
      targetId: event._id.toString(),
      details: {
        homeTeam: homeTeam.name,
        awayTeam: awayTeam.name,
        startTime,
        odds: event.odds,
      },
    })

    return event
  }

  /**
   * Update event odds
   * @param {string} eventId - Event ID
   * @param {Object} odds - New odds
   * @param {string} updatedBy - User ID
   */
  static async updateEventOdds(eventId, odds, updatedBy) {
    const event = await Event.findById(eventId)
    if (!event) throw new Error("Event not found")
    if (event.status === "finished") throw new Error("Cannot update finished event")

    const previousOdds = { ...event.odds }

    if (odds.home) event.odds.home = odds.home
    if (odds.draw) event.odds.draw = odds.draw
    if (odds.away) event.odds.away = odds.away
    if (odds.markets) {
      event.markets = { ...event.markets, ...odds.markets }
    }

    await event.save()

    await logAudit({
      action: "sandbox_odds_updated",
      performedBy: updatedBy,
      targetType: "event",
      targetId: eventId,
      details: { previousOdds, newOdds: event.odds },
    })

    return event
  }

  /**
   * Validate bet slip selections
   * @param {Array} selections - Bet selections
   * @param {Object} limits - Betting limits
   * @returns {Object} Validation result
   */
  static async validateSelections(selections, limits) {
    const errors = []
    const warnings = []

    if (!selections || selections.length === 0) {
      errors.push("No selections provided")
      return { valid: false, errors, warnings }
    }

    if (selections.length > limits.maxSelectionsPerSlip) {
      errors.push(`Maximum ${limits.maxSelectionsPerSlip} selections allowed per slip`)
    }

    // Check each selection
    const eventIds = new Set()
    for (const selection of selections) {
      // Check for duplicate events
      if (eventIds.has(selection.eventId.toString())) {
        errors.push(`Duplicate selection for event ${selection.eventName || selection.eventId}`)
      }
      eventIds.add(selection.eventId.toString())

      // Validate odds
      if (selection.odds < limits.minOdds) {
        errors.push(`Odds ${selection.odds} below minimum ${limits.minOdds}`)
      }
      if (selection.odds > limits.maxOddsPerSelection) {
        warnings.push(`Selection odds ${selection.odds} exceed recommended maximum`)
      }

      // Verify event is open for betting
      const event = await Event.findById(selection.eventId)
      if (!event) {
        errors.push(`Event ${selection.eventId} not found`)
        continue
      }
      if (!event.isBettingOpen) {
        errors.push(`Betting closed for ${event.name}`)
      }
      if (event.status === "finished" || event.status === "cancelled") {
        errors.push(`Event ${event.name} is ${event.status}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Calculate total odds for multi-selection slip
   * @param {Array} selections - Bet selections
   * @returns {number} Combined odds
   */
  static calculateTotalOdds(selections) {
    if (!selections || selections.length === 0) return 0
    if (selections.length === 1) return selections[0].odds

    return selections.reduce((total, sel) => total * sel.odds, 1)
  }

  /**
   * Validate bet against limits (MAX WINNING ENFORCEMENT)
   * This is the key regulator requirement - enforce max winning server-side
   *
   * @param {Object} params - Bet parameters
   * @returns {Object} Validation result with enforcement details
   */
  static async validateBetLimits({ stake, selections, tenantId, userId }) {
    const limits = await this.getLimits(tenantId)
    const totalOdds = this.calculateTotalOdds(selections)
    const potentialWin = stake * totalOdds

    const result = {
      valid: true,
      stake,
      totalOdds: Number(totalOdds.toFixed(2)),
      potentialWin: Number(potentialWin.toFixed(2)),
      maxWinning: limits.maxWinning,
      errors: [],
      adjustments: null,
      enforcement: {
        maxWinningEnforced: false,
        originalPotentialWin: potentialWin,
        limitedPotentialWin: null,
        maxAllowedStake: null,
      },
    }

    // Validate minimum stake
    if (stake < limits.minStake) {
      result.valid = false
      result.errors.push(`Minimum stake is ${limits.minStake}`)
    }

    // Validate maximum stake
    if (stake > limits.maxStake) {
      result.valid = false
      result.errors.push(`Maximum stake is ${limits.maxStake}`)
    }

    // MAX WINNING ENFORCEMENT (Critical for regulators)
    // Player can place unlimited stake and selections
    // Only restriction is MAX WINNING LIMIT
    if (potentialWin > limits.maxWinning) {
      result.valid = false
      result.enforcement.maxWinningEnforced = true
      result.enforcement.limitedPotentialWin = limits.maxWinning
      result.enforcement.maxAllowedStake = Number((limits.maxWinning / totalOdds).toFixed(2))

      result.errors.push(
        `Potential winning ${potentialWin.toFixed(2)} exceeds maximum allowed ${limits.maxWinning}. ` +
          `Maximum stake at these odds: ${result.enforcement.maxAllowedStake}`,
      )
    }

    // Validate total odds (prevent extreme multipliers)
    if (totalOdds > limits.maxOdds) {
      result.valid = false
      result.errors.push(`Combined odds ${totalOdds.toFixed(2)} exceed maximum ${limits.maxOdds}`)
    }

    return result
  }

  /**
   * Place a bet with full validation and ledger recording
   *
   * @param {Object} params - Bet parameters
   * @returns {Promise<Object>} Bet result
   */
  static async placeBet({ userId, tenantId, walletId, selections, stake, betType = "single", createdBy }) {
    // Validate selections
    const limits = await this.getLimits(tenantId)
    const selectionValidation = await this.validateSelections(selections, limits)

    if (!selectionValidation.valid) {
      return {
        success: false,
        error: "Selection validation failed",
        details: selectionValidation.errors,
      }
    }

    // Validate bet limits (including max winning)
    const betValidation = await this.validateBetLimits({
      stake,
      selections,
      tenantId,
      userId,
    })

    if (!betValidation.valid) {
      return {
        success: false,
        error: "Bet validation failed",
        details: betValidation.errors,
        enforcement: betValidation.enforcement,
      }
    }

    // Create bet record
    const normalizedSelections = await Promise.all(
      selections.map(async (s) => {
        const event = await Event.findById(s.eventId)
        return {
          eventId: s.eventId,
          marketId: s.marketId,
          eventName: s.eventName || event?.name || "Unknown Event",
          marketName: s.marketName || s.market || "Match Winner",
          selectionName: s.selectionName || s.selection || "Unknown",
          odds: s.odds,
          status: "pending",
        }
      }),
    )

    const bet = await Bet.create({
      userId,
      tenantId,
      type: betType === "multiple" || selections.length > 1 ? "multiple" : "single",
      stake,
      currency: "USD",
      totalOdds: betValidation.totalOdds,
      potentialWin: betValidation.potentialWin,
      selections: normalizedSelections,
      status: "pending",
      placedFrom: {
        device: "sandbox",
        userAgent: "SandboxSportsEngine",
      },
    })

    // Record in ledger (double-entry)
    await LedgerEngine.recordBetPlacement({
      walletId,
      userId,
      tenantId,
      betId: bet._id,
      amount: stake,
      currency: "USD",
      createdBy: createdBy || userId,
    })

    // Audit logs are for admin actions like void, cancel, manual settle
    // Bet placement is tracked in the ledger and bet records instead

    return {
      success: true,
      bet: {
        _id: bet._id,
        ticketNumber: bet.ticketNumber,
        type: bet.type,
        stake: bet.stake,
        totalOdds: bet.totalOdds,
        potentialWin: bet.potentialWin,
        selections: bet.selections,
        status: bet.status,
        createdAt: bet.createdAt,
      },
      validation: {
        maxWinningLimit: limits.maxWinning,
        maxWinningEnforced: betValidation.enforcement.maxWinningEnforced,
        warnings: selectionValidation.warnings,
      },
    }
  }

  /**
   * Get available events for betting
   */
  static async getAvailableEvents({ sportId, leagueId, status = "scheduled", limit = 50 }) {
    const query = {}

    // Add status filter if not 'all'
    if (status !== "all") {
      query.status = status
    }

    if (sportId) query.sportId = sportId
    if (leagueId) query.leagueId = leagueId

    console.log("[v0] Sports Engine: Event query:", JSON.stringify(query, null, 2))

    const events = await Event.find(query)
      .populate("sportId", "name slug icon")
      .populate("leagueId", "name country")
      .sort({ startTime: 1 })
      .limit(limit)
      .lean()

    console.log("[v0] Sports Engine: Found", events.length, "events")

    if (events.length > 0) {
      console.log("[v0] Sports Engine: First event:", {
        _id: events[0]._id,
        name: events[0].name,
        status: events[0].status,
        metadata: events[0].metadata,
        startTime: events[0].startTime,
      })
    } else {
      // Debug: Check what's actually in the database
      const totalEvents = await Event.countDocuments({})
      console.log("[v0] Sports Engine: Found", totalEvents, "total events in database")

      if (totalEvents > 0) {
        const sampleEvent = await Event.findOne({}).lean()
        console.log("[v0] Sports Engine: Sample event structure:", {
          _id: sampleEvent._id,
          name: sampleEvent.name,
          status: sampleEvent.status,
          metadata: sampleEvent.metadata,
          hasMetadata: !!sampleEvent.metadata,
          metadataKeys: sampleEvent.metadata ? Object.keys(sampleEvent.metadata) : [],
        })
      }
    }

    return events
  }

  /**
   * Get bet slip summary
   */
  static async getBetSlipSummary(selections, stake, tenantId) {
    const limits = await this.getLimits(tenantId)
    const totalOdds = this.calculateTotalOdds(selections)
    const potentialWin = stake * totalOdds

    return {
      selectionsCount: selections.length,
      totalOdds: Number(totalOdds.toFixed(2)),
      stake,
      potentialWin: Number(potentialWin.toFixed(2)),
      maxWinningLimit: limits.maxWinning,
      exceedsMaxWinning: potentialWin > limits.maxWinning,
      maxAllowedStake: potentialWin > limits.maxWinning ? Number((limits.maxWinning / totalOdds).toFixed(2)) : null,
    }
  }
}

export default SandboxSportsEngine
