import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

// Mock FAQ data
const MOCK_FAQ = [
  {
    category: "Account",
    questions: [
      {
        q: "How do I verify my account?",
        a: "Go to Settings > Verification and upload a valid ID document and proof of address. Verification usually takes 24-48 hours.",
      },
      {
        q: "How do I change my password?",
        a: "Go to Settings > Security > Change Password. You'll need to enter your current password and then your new password twice.",
      },
      {
        q: "Can I have multiple accounts?",
        a: "No, each user is allowed only one account. Multiple accounts may result in suspension.",
      },
    ],
  },
  {
    category: "Deposits & Withdrawals",
    questions: [
      {
        q: "What payment methods are accepted?",
        a: "We accept credit/debit cards, bank transfers, e-wallets (PayPal, Skrill, Neteller), and cryptocurrency.",
      },
      {
        q: "How long do withdrawals take?",
        a: "E-wallets: 24 hours, Cards: 3-5 business days, Bank transfer: 5-7 business days, Crypto: 1-2 hours.",
      },
      {
        q: "What is the minimum deposit/withdrawal?",
        a: "Minimum deposit is $10. Minimum withdrawal is $20.",
      },
    ],
  },
  {
    category: "Betting",
    questions: [
      {
        q: "What happens if my bet is voided?",
        a: "If a bet is voided, your stake will be refunded to your account. In accumulators, the voided selection is removed and odds recalculated.",
      },
      {
        q: "What is cash out?",
        a: "Cash out allows you to settle a bet before the event ends. The amount offered depends on the current state of your bet.",
      },
      {
        q: "What are the maximum bet limits?",
        a: "Limits vary by sport and market. You can see the maximum stake when placing a bet. VIP members have higher limits.",
      },
    ],
  },
  {
    category: "Promotions",
    questions: [
      {
        q: "How do I claim a bonus?",
        a: "Bonuses are automatically credited when you meet the requirements. Some require a bonus code entered during deposit.",
      },
      {
        q: "What are wagering requirements?",
        a: "Wagering requirements indicate how many times you must bet the bonus amount before withdrawing. Check each bonus terms for details.",
      },
      {
        q: "Can I combine multiple bonuses?",
        a: "Generally, only one bonus can be active at a time. New bonuses cannot be claimed until current wagering requirements are met.",
      },
    ],
  },
]

// Mock tickets data
const MOCK_TICKETS = [
  {
    id: "TKT-001",
    subject: "Withdrawal pending for 5 days",
    category: "withdrawal",
    status: "in_progress",
    priority: "high",
    createdAt: "2024-01-15T10:30:00Z",
    messages: [
      {
        sender: "user",
        message: "My withdrawal has been pending for 5 days. Order #12345",
        createdAt: "2024-01-15T10:30:00Z",
      },
      {
        sender: "support",
        message: "We're looking into this. Can you confirm your verification status?",
        createdAt: "2024-01-15T11:45:00Z",
      },
    ],
  },
  {
    id: "TKT-002",
    subject: "Cannot login to my account",
    category: "account",
    status: "resolved",
    priority: "medium",
    createdAt: "2024-01-10T14:20:00Z",
    messages: [
      { sender: "user", message: "Getting an error when trying to login", createdAt: "2024-01-10T14:20:00Z" },
      {
        sender: "support",
        message: "Please try resetting your password using the forgot password link.",
        createdAt: "2024-01-10T15:00:00Z",
      },
      { sender: "user", message: "That worked! Thank you.", createdAt: "2024-01-10T15:30:00Z" },
    ],
  },
]

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "faq" // faq, tickets

    if (type === "faq") {
      return NextResponse.json({
        success: true,
        faq: MOCK_FAQ,
      })
    }

    // Tickets require auth
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded?.userId) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      tickets: MOCK_TICKETS,
    })
  } catch (error) {
    console.error("Support API error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Create new ticket or add message
export async function POST(request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded?.userId) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const { action, subject, category, message, ticketId } = await request.json()

    if (action === "create") {
      // Create new ticket
      const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`
      return NextResponse.json({
        success: true,
        ticket: {
          id: ticketNumber,
          subject,
          category,
          status: "open",
          priority: "medium",
          createdAt: new Date().toISOString(),
          messages: [{ sender: "user", message, createdAt: new Date().toISOString() }],
        },
        message: "Ticket created successfully",
      })
    }

    if (action === "reply") {
      // Add message to existing ticket
      return NextResponse.json({
        success: true,
        message: "Message sent successfully",
      })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Support ticket error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
