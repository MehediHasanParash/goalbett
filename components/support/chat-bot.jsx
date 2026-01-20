"use client"
import { useState, useRef, useEffect } from "react"
import { X, Send, Bot, User, Loader2, Headphones } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const botResponses = {
  greeting: "Hello! Welcome to GoalBett Support. How can I help you today?",
  deposit:
    "To make a deposit, go to your Wallet page and select 'Deposit'. We support M-Pesa, Bank Transfer, and Crypto. Minimum deposit is $10. Is there anything specific about deposits you'd like to know?",
  withdrawal:
    "Withdrawals can be made from your Wallet page. Select 'Withdraw' and choose your preferred method. Processing times vary: M-Pesa (instant), Bank Transfer (1-3 days), Crypto (within 1 hour). Minimum withdrawal is $20.",
  bonus:
    "We offer several bonuses: Welcome Bonus (100% up to $500), Daily Cashback (10%), and Free Bets on selected matches. Check our Promotions page for current offers!",
  account:
    "For account issues, you can: 1) Reset password from login page, 2) Update profile in Settings, 3) Verify identity by uploading documents in Account Settings. What specific account help do you need?",
  betting:
    "To place a bet: 1) Browse Sports or In-Play section, 2) Click on odds to add to betslip, 3) Enter stake amount, 4) Confirm bet. Need help with a specific betting feature?",
  verification:
    "Account verification requires: 1) Valid ID (passport/national ID), 2) Proof of address (utility bill/bank statement). Upload documents in Settings > Verification. Processing takes 24-48 hours.",
  default:
    "I'm not sure I understand. Could you please rephrase your question? You can also contact our support team directly via WhatsApp at +46739905688 or email support@goalbett.com",
  human:
    "I'll connect you with a human agent. Please wait while we find an available support representative. In the meantime, you can also reach us directly via WhatsApp at +46739905688.",
}

const quickReplies = [
  { label: "Deposit Help", keyword: "deposit" },
  { label: "Withdrawal", keyword: "withdrawal" },
  { label: "Bonuses", keyword: "bonus" },
  { label: "Account Issues", keyword: "account" },
  { label: "How to Bet", keyword: "betting" },
  { label: "Verification", keyword: "verification" },
  { label: "Talk to Human", keyword: "human" },
]

function getResponse(message) {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("deposit") || lowerMessage.includes("add money") || lowerMessage.includes("fund")) {
    return botResponses.deposit
  }
  if (lowerMessage.includes("withdraw") || lowerMessage.includes("cash out") || lowerMessage.includes("payout")) {
    return botResponses.withdrawal
  }
  if (
    lowerMessage.includes("bonus") ||
    lowerMessage.includes("promotion") ||
    lowerMessage.includes("offer") ||
    lowerMessage.includes("free bet")
  ) {
    return botResponses.bonus
  }
  if (
    lowerMessage.includes("account") ||
    lowerMessage.includes("password") ||
    lowerMessage.includes("login") ||
    lowerMessage.includes("profile")
  ) {
    return botResponses.account
  }
  if (
    lowerMessage.includes("bet") ||
    lowerMessage.includes("odds") ||
    lowerMessage.includes("place") ||
    lowerMessage.includes("wager")
  ) {
    return botResponses.betting
  }
  if (
    lowerMessage.includes("verify") ||
    lowerMessage.includes("verification") ||
    lowerMessage.includes("kyc") ||
    lowerMessage.includes("document") ||
    lowerMessage.includes("id")
  ) {
    return botResponses.verification
  }
  if (
    lowerMessage.includes("human") ||
    lowerMessage.includes("agent") ||
    lowerMessage.includes("person") ||
    lowerMessage.includes("real") ||
    lowerMessage.includes("support team")
  ) {
    return botResponses.human
  }
  if (
    lowerMessage.includes("hi") ||
    lowerMessage.includes("hello") ||
    lowerMessage.includes("hey") ||
    lowerMessage.includes("help")
  ) {
    return botResponses.greeting
  }

  return botResponses.default
}

export function ChatBot({ onClose }) {
  const [messages, setMessages] = useState([{ id: 1, type: "bot", text: botResponses.greeting, time: new Date() }])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = (text = input) => {
    if (!text.trim()) return

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: text.trim(),
      time: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate bot typing delay
    setTimeout(
      () => {
        const botMessage = {
          id: Date.now() + 1,
          type: "bot",
          text: getResponse(text),
          time: new Date(),
        }
        setMessages((prev) => [...prev, botMessage])
        setIsTyping(false)
      },
      1000 + Math.random() * 1000,
    )
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleQuickReply = (keyword) => {
    handleSend(keyword)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-md h-[85vh] sm:h-[600px] bg-[#0D1F35] sm:rounded-2xl flex flex-col overflow-hidden border border-[#2A3F55] shadow-2xl">
        {/* Header */}
        <div className="bg-[#1A2F45] px-4 py-4 flex items-center justify-between border-b border-[#2A3F55]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFD700] flex items-center justify-center">
              <Headphones className="w-5 h-5 text-[#0A1A2F]" />
            </div>
            <div>
              <h3 className="font-bold text-white">GoalBett Support</h3>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Online
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#2A3F55] rounded-lg transition-colors">
            <X className="w-5 h-5 text-[#B8C5D6]" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex items-end gap-2 max-w-[85%] ${message.type === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === "user" ? "bg-[#FFD700]" : "bg-[#2A3F55]"
                  }`}
                >
                  {message.type === "user" ? (
                    <User className="w-4 h-4 text-[#0A1A2F]" />
                  ) : (
                    <Bot className="w-4 h-4 text-[#FFD700]" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-2xl ${
                    message.type === "user"
                      ? "bg-[#FFD700] text-[#0A1A2F] rounded-br-sm"
                      : "bg-[#1A2F45] text-white rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.type === "user" ? "text-[#0A1A2F]/60" : "text-[#B8C5D6]"}`}>
                    {message.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-[#2A3F55] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#FFD700]" />
                </div>
                <div className="bg-[#1A2F45] p-3 rounded-2xl rounded-bl-sm">
                  <div className="flex items-center gap-1">
                    <Loader2 className="w-4 h-4 animate-spin text-[#FFD700]" />
                    <span className="text-sm text-[#B8C5D6]">Typing...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        <div className="px-4 py-2 border-t border-[#2A3F55] bg-[#0D1F35]">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {quickReplies.map((reply) => (
              <button
                key={reply.keyword}
                onClick={() => handleQuickReply(reply.keyword)}
                className="flex-shrink-0 px-3 py-1.5 bg-[#1A2F45] hover:bg-[#2A3F55] border border-[#2A3F55] rounded-full text-xs text-white transition-colors"
              >
                {reply.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[#2A3F55] bg-[#0D1F35]">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 bg-[#1A2F45] border-[#2A3F55] text-white placeholder-[#B8C5D6]"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="bg-[#FFD700] hover:bg-[#E5C200] text-[#0A1A2F] px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
