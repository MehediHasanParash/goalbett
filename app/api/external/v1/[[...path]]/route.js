import { NextResponse } from "next/server"
import { validateApiKey, checkScope, logApiUsage } from "@/lib/api-key-auth"
import dbConnect from "@/lib/mongodb"
import { Bet, User, Event, Transaction, ApiKey } from "@/lib/models"

// External API gateway - all external API requests go through here
export async function GET(request, { params }) {
  const startTime = Date.now()

  // Validate API key
  const validation = await validateApiKey(request)
  if (!validation.valid) {
    return NextResponse.json(
      {
        error: validation.error,
        code: validation.code,
        ...(validation.retryAfter && { retryAfter: validation.retryAfter }),
      },
      {
        status: validation.code === "RATE_LIMIT_EXCEEDED" ? 429 : 401,
        headers: validation.retryAfter ? { "Retry-After": String(validation.retryAfter) } : {},
      },
    )
  }

  const { apiKey, tenant, rateLimitStatus } = validation
  const resolvedParams = await params
  const pathSegments = resolvedParams.path || []
  const endpoint = "/" + pathSegments.join("/")

  try {
    await dbConnect()

    let data = null
    let requiredScope = ""

    // Route to appropriate handler based on path
    switch (pathSegments[0]) {
      case "bets":
        requiredScope = "read:bets"
        if (!checkScope(apiKey, requiredScope)) {
          return NextResponse.json({ error: "Insufficient scope", required: requiredScope }, { status: 403 })
        }
        data = await handleBetsEndpoint(pathSegments, tenant._id, request)
        break

      case "players":
        requiredScope = "read:players"
        if (!checkScope(apiKey, requiredScope)) {
          return NextResponse.json({ error: "Insufficient scope", required: requiredScope }, { status: 403 })
        }
        data = await handlePlayersEndpoint(pathSegments, tenant._id, request)
        break

      case "events":
        requiredScope = "read:events"
        if (!checkScope(apiKey, requiredScope)) {
          return NextResponse.json({ error: "Insufficient scope", required: requiredScope }, { status: 403 })
        }
        data = await handleEventsEndpoint(pathSegments, tenant._id, request)
        break

      case "odds":
        requiredScope = "read:odds"
        if (!checkScope(apiKey, requiredScope)) {
          return NextResponse.json({ error: "Insufficient scope", required: requiredScope }, { status: 403 })
        }
        data = await handleOddsEndpoint(pathSegments, tenant._id, request)
        break

      case "transactions":
        requiredScope = "read:transactions"
        if (!checkScope(apiKey, requiredScope)) {
          return NextResponse.json({ error: "Insufficient scope", required: requiredScope }, { status: 403 })
        }
        data = await handleTransactionsEndpoint(pathSegments, tenant._id, request)
        break

      case "health":
        data = { status: "ok", timestamp: new Date().toISOString() }
        break

      default:
        await logApiUsage(apiKey, request, 404, Date.now() - startTime, {
          code: "ENDPOINT_NOT_FOUND",
          message: `Endpoint ${endpoint} not found`,
        })
        return NextResponse.json({ error: "Endpoint not found" }, { status: 404 })
    }

    const responseTime = Date.now() - startTime
    await logApiUsage(apiKey, request, 200, responseTime)

    return NextResponse.json({
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        rateLimit: {
          remaining: {
            minute: rateLimitStatus.minuteLimit - rateLimitStatus.minuteCount - 1,
            hour: rateLimitStatus.hourLimit - rateLimitStatus.hourCount - 1,
            day: rateLimitStatus.dayLimit - rateLimitStatus.dayCount - 1,
          },
          limit: {
            minute: rateLimitStatus.minuteLimit,
            hour: rateLimitStatus.hourLimit,
            day: rateLimitStatus.dayLimit,
          },
        },
      },
    })
  } catch (error) {
    console.error("[External API] Error:", error)
    await logApiUsage(apiKey, request, 500, Date.now() - startTime, {
      code: "INTERNAL_ERROR",
      message: error.message,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  const startTime = Date.now()

  const validation = await validateApiKey(request)
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error, code: validation.code },
      { status: validation.code === "RATE_LIMIT_EXCEEDED" ? 429 : 401 },
    )
  }

  const { apiKey, tenant, rateLimitStatus } = validation
  const resolvedParams = await params
  const pathSegments = resolvedParams.path || []

  try {
    await dbConnect()
    const body = await request.json()

    let data = null
    let requiredScope = ""

    switch (pathSegments[0]) {
      case "bets":
        requiredScope = "write:bets"
        if (!checkScope(apiKey, requiredScope)) {
          return NextResponse.json({ error: "Insufficient scope", required: requiredScope }, { status: 403 })
        }
        data = await handleCreateBet(body, tenant._id, apiKey)
        break

      case "webhooks":
        requiredScope = "webhooks:manage"
        if (!checkScope(apiKey, requiredScope)) {
          return NextResponse.json({ error: "Insufficient scope", required: requiredScope }, { status: 403 })
        }
        data = await handleWebhookConfig(body, apiKey)
        break

      default:
        return NextResponse.json({ error: "Endpoint not found" }, { status: 404 })
    }

    const responseTime = Date.now() - startTime
    await logApiUsage(apiKey, request, 201, responseTime)

    return NextResponse.json(
      {
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          responseTime: `${responseTime}ms`,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[External API] POST Error:", error)
    await logApiUsage(apiKey, request, 500, Date.now() - startTime, {
      code: "INTERNAL_ERROR",
      message: error.message,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Endpoint handlers
async function handleBetsEndpoint(pathSegments, tenantId, request) {
  const url = new URL(request.url)
  const limit = Number.parseInt(url.searchParams.get("limit")) || 50
  const offset = Number.parseInt(url.searchParams.get("offset")) || 0
  const status = url.searchParams.get("status")

  const query = { tenant: tenantId }
  if (status) query.status = status

  if (pathSegments[1]) {
    // Get specific bet
    const bet = await Bet.findOne({ _id: pathSegments[1], tenant: tenantId }).select("-__v").lean()
    return bet
  }

  const bets = await Bet.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit).select("-__v").lean()

  const total = await Bet.countDocuments(query)

  return { bets, pagination: { total, limit, offset } }
}

async function handlePlayersEndpoint(pathSegments, tenantId, request) {
  const url = new URL(request.url)
  const limit = Number.parseInt(url.searchParams.get("limit")) || 50
  const offset = Number.parseInt(url.searchParams.get("offset")) || 0

  if (pathSegments[1]) {
    const player = await User.findOne({ _id: pathSegments[1], tenant_id: tenantId, role: "player" })
      .select("username email phone createdAt status kycStatus")
      .lean()
    return player
  }

  const players = await User.find({ tenant_id: tenantId, role: "player" })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .select("username email phone createdAt status kycStatus")
    .lean()

  const total = await User.countDocuments({ tenant_id: tenantId, role: "player" })

  return { players, pagination: { total, limit, offset } }
}

async function handleEventsEndpoint(pathSegments, tenantId, request) {
  const url = new URL(request.url)
  const limit = Number.parseInt(url.searchParams.get("limit")) || 50
  const status = url.searchParams.get("status") || "upcoming"

  const events = await Event.find({ status }).sort({ startTime: 1 }).limit(limit).select("-__v").lean()

  return { events }
}

async function handleOddsEndpoint(pathSegments, tenantId, request) {
  if (!pathSegments[1]) {
    return { error: "Event ID required" }
  }

  const event = await Event.findById(pathSegments[1]).populate("markets").lean()

  if (!event) {
    return { error: "Event not found" }
  }

  return { eventId: event._id, odds: event.markets }
}

async function handleTransactionsEndpoint(pathSegments, tenantId, request) {
  const url = new URL(request.url)
  const limit = Number.parseInt(url.searchParams.get("limit")) || 50
  const offset = Number.parseInt(url.searchParams.get("offset")) || 0
  const type = url.searchParams.get("type")

  const query = { tenant_id: tenantId }
  if (type) query.type = type

  const transactions = await Transaction.find(query)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .select("-__v")
    .lean()

  const total = await Transaction.countDocuments(query)

  return { transactions, pagination: { total, limit, offset } }
}

async function handleCreateBet(body, tenantId, apiKey) {
  // Implement bet creation via API
  // This would integrate with your existing bet placement logic
  return { message: "Bet creation via API - implement based on your bet flow" }
}

async function handleWebhookConfig(body, apiKey) {
  // Update webhook configuration
  await ApiKey.findByIdAndUpdate(apiKey._id, {
    "webhooks.url": body.url,
    "webhooks.events": body.events,
    "webhooks.enabled": true,
  })
  return { message: "Webhook configured successfully" }
}
