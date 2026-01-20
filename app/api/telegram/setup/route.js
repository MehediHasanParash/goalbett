/**
 * Telegram Bot Setup API
 *
 * POST - Set webhook URL for Telegram bot
 * GET - Get current webhook info
 */

import { NextResponse } from "next/server"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

// POST - Set webhook
export async function POST(request) {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error: "TELEGRAM_BOT_TOKEN not configured",
        },
        { status: 400 },
      )
    }

    const { webhookUrl } = await request.json()
    const url = webhookUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`

    // Set webhook
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: true,
      }),
    })

    const result = await response.json()

    if (result.ok) {
      // Set bot commands
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyCommands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commands: [
            { command: "start", description: "Open GoalBett betting app" },
            { command: "balance", description: "Check your wallet balance" },
            { command: "bets", description: "View your recent bets" },
            { command: "help", description: "Show help and commands" },
          ],
        }),
      })

      return NextResponse.json({
        success: true,
        message: "Webhook set successfully",
        webhookUrl: url,
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: result.description,
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("[Telegram] Setup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

// GET - Get webhook info
export async function GET() {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({
        success: false,
        error: "TELEGRAM_BOT_TOKEN not configured",
        setup_required: true,
      })
    }

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`)

    const result = await response.json()

    // Get bot info
    const botResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`)
    const botInfo = await botResponse.json()

    return NextResponse.json({
      success: true,
      webhook: result.result,
      bot: botInfo.result,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
