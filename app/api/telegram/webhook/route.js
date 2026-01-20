/**
 * Telegram Bot Webhook Handler
 *
 * Handles incoming messages from Telegram
 */

import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"
import Wallet from "@/lib/models/Wallet"
import Bet from "@/lib/models/Bet"
import jwt from "jsonwebtoken"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const WEBAPP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://goalbett.com"
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID

// Send message to Telegram
async function sendTelegramMessage(chatId, text, options = {}) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("[Telegram] Bot token not configured")
    return null
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

  const body = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...options,
  }

  try {
    console.log("[Telegram] Sending message to chat:", chatId)
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const result = await response.json()
    console.log("[Telegram] Send result:", result.ok ? "success" : result.description)
    return result
  } catch (error) {
    console.error("[Telegram] Send message error:", error)
    return null
  }
}

// Generate auth token for user
function generateTelegramAuthToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      telegramId: user.telegramId,
      username: user.username,
      tenant_id: user.tenant_id?.toString(),
      role: user.role,
      source: "telegram",
    },
    process.env.JWT_SECRET || "fallback-jwt-secret-change-me",
    { expiresIn: "7d" },
  )
}

// Find or create user from Telegram data
async function findOrCreateTelegramUser(telegramUser) {
  let user = await User.findOne({ telegramId: telegramUser.id.toString() })

  if (!user) {
    console.log("[Telegram] Creating new user for:", telegramUser.username || telegramUser.id)

    // Create new user from Telegram
    user = await User.create({
      telegramId: telegramUser.id.toString(),
      username: telegramUser.username || `tg_${telegramUser.id}`,
      fullName:
        `${telegramUser.first_name || ""} ${telegramUser.last_name || ""}`.trim() ||
        telegramUser.username ||
        `User ${telegramUser.id}`,
      role: "player",
      tenant_id: DEFAULT_TENANT_ID,
      status: "active",
      isActive: true,
      registrationSource: "telegram",
      metadata: {
        telegram: {
          id: telegramUser.id,
          username: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          languageCode: telegramUser.language_code,
        },
      },
    })

    // Create wallet for new user with welcome bonus
    await Wallet.create({
      userId: user._id,
      tenantId: DEFAULT_TENANT_ID,
      availableBalance: 100, // Welcome bonus
      bonusBalance: 0,
      currency: "USD",
      metadata: { source: "telegram_signup", welcomeBonus: true },
    })

    console.log("[Telegram] User created:", user._id)
  }

  return user
}

// POST - Handle Telegram webhook
export async function POST(request) {
  try {
    console.log("[Telegram] Webhook received")

    if (!TELEGRAM_BOT_TOKEN) {
      console.error("[Telegram] TELEGRAM_BOT_TOKEN not set!")
      return NextResponse.json({ ok: true })
    }

    await connectDB()

    const update = await request.json()
    console.log("[Telegram] Update type:", update.message ? "message" : update.callback_query ? "callback" : "other")

    // Handle message
    if (update.message) {
      const message = update.message
      const chatId = message.chat.id
      const text = message.text || ""
      const telegramUser = message.from

      console.log("[Telegram] Message from:", telegramUser.username || telegramUser.id, "Text:", text)

      // /start command
      if (text.startsWith("/start")) {
        const user = await findOrCreateTelegramUser(telegramUser)
        const token = generateTelegramAuthToken(user)
        const wallet = await Wallet.findOne({ userId: user._id })
        const balance = wallet?.availableBalance || 100

        const webAppUrl = `${WEBAPP_URL}/tma?token=${token}`

        await sendTelegramMessage(
          chatId,
          `🎰 <b>Welcome to GoalBett!</b>\n\n` +
            `Hey ${telegramUser.first_name || "there"}! Ready to bet?\n\n` +
            `💰 Your balance: <b>$${balance.toFixed(2)}</b>\n\n` +
            `Tap the button below to start betting:`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🎮 Open GoalBett",
                    web_app: { url: webAppUrl },
                  },
                ],
                [
                  { text: "💰 Balance", callback_data: "balance" },
                  { text: "📊 My Bets", callback_data: "bets" },
                ],
                [{ text: "❓ Help", callback_data: "help" }],
              ],
            },
          },
        )
        return NextResponse.json({ ok: true })
      }

      // /balance command
      if (text === "/balance") {
        const user = await User.findOne({ telegramId: telegramUser.id.toString() })

        if (!user) {
          await sendTelegramMessage(chatId, "You haven't signed up yet! Use /start to create an account.")
          return NextResponse.json({ ok: true })
        }

        const wallet = await Wallet.findOne({ userId: user._id })
        const balance = wallet?.availableBalance || 0
        const bonus = wallet?.bonusBalance || 0

        await sendTelegramMessage(
          chatId,
          `💰 <b>Your Wallet</b>\n\n` +
            `Available: <b>$${balance.toFixed(2)}</b>\n` +
            `Bonus: <b>$${bonus.toFixed(2)}</b>\n\n` +
            `Total: <b>$${(balance + bonus).toFixed(2)}</b>`,
        )
        return NextResponse.json({ ok: true })
      }

      // /bets command
      if (text === "/bets") {
        const user = await User.findOne({ telegramId: telegramUser.id.toString() })

        if (!user) {
          await sendTelegramMessage(chatId, "You haven't signed up yet! Use /start to create an account.")
          return NextResponse.json({ ok: true })
        }

        const bets = await Bet.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5).lean()

        if (bets.length === 0) {
          await sendTelegramMessage(
            chatId,
            "📊 <b>Your Bets</b>\n\n" +
              "You haven't placed any bets yet.\n\n" +
              "Use /start to open the app and start betting!",
          )
          return NextResponse.json({ ok: true })
        }

        const betsList = bets
          .map((bet, i) => {
            const statusEmoji = bet.status === "won" ? "✅" : bet.status === "lost" ? "❌" : "⏳"
            return `${i + 1}. ${statusEmoji} $${bet.stake?.toFixed(2) || "0.00"} @ ${bet.totalOdds?.toFixed(2) || bet.odds?.toFixed(2) || "N/A"}\n   ${bet.status?.toUpperCase() || "PENDING"}`
          })
          .join("\n\n")

        await sendTelegramMessage(chatId, `📊 <b>Your Recent Bets</b>\n\n${betsList}`)
        return NextResponse.json({ ok: true })
      }

      // /help command
      if (text === "/help") {
        await sendTelegramMessage(
          chatId,
          `❓ <b>GoalBett Help</b>\n\n` +
            `Available commands:\n\n` +
            `/start - Open the betting app\n` +
            `/balance - Check your wallet balance\n` +
            `/bets - View your recent bets\n` +
            `/help - Show this help message\n\n` +
            `Need support? Contact @GoalBettSupport`,
        )
        return NextResponse.json({ ok: true })
      }

      // Default response for unknown commands
      if (text.startsWith("/")) {
        await sendTelegramMessage(chatId, `Unknown command. Use /help to see available commands.`)
      }
    }

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      const callback = update.callback_query
      const chatId = callback.message.chat.id
      const data = callback.data
      const telegramUser = callback.from

      console.log("[Telegram] Callback from:", telegramUser.username || telegramUser.id, "Data:", data)

      // Answer callback to remove loading state
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callback.id }),
      })

      const user = await User.findOne({ telegramId: telegramUser.id.toString() })

      if (data === "balance" && user) {
        const wallet = await Wallet.findOne({ userId: user._id })
        await sendTelegramMessage(chatId, `💰 Your balance: <b>$${(wallet?.availableBalance || 0).toFixed(2)}</b>`)
      }

      if (data === "bets" && user) {
        const activeBets = await Bet.countDocuments({ userId: user._id, status: "pending" })
        await sendTelegramMessage(chatId, `📊 You have <b>${activeBets}</b> active bet(s).\n\nUse /bets for details.`)
      }

      if (data === "help") {
        await sendTelegramMessage(
          chatId,
          `Use /help for the full command list, or tap "Open GoalBett" to start betting!`,
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[Telegram] Webhook error:", error)
    // Always return 200 to Telegram to prevent retries
    return NextResponse.json({ ok: true })
  }
}

// GET - Webhook status
export async function GET(request) {
  return NextResponse.json({
    status: "active",
    bot: TELEGRAM_BOT_TOKEN ? "configured" : "NOT_CONFIGURED",
    webhook_url: `${WEBAPP_URL}/api/telegram/webhook`,
  })
}
