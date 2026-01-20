"use client"

import { useState } from "react"
import { AlertCircle, Clock, DollarSign, Ban } from "lucide-react"
import {
  setSessionLimits,
  setSelfExclusion,
  getSessionRemainingTime,
  getLossLimitStatus,
  getSelfExclusionRemaining,
} from "@/lib/compliance-service"

export default function ResponsibleGaming() {
  const [activeTab, setActiveTab] = useState("session")
  const [sessionMinutes, setSessionMinutes] = useState(120)
  const [depositLimit, setDepositLimit] = useState(1000)
  const [lossLimit, setLossLimit] = useState(500)
  const [selfExclusionDays, setSelfExclusionDays] = useState(30)
  const [saved, setSaved] = useState(false)

  const sessionTime = getSessionRemainingTime()
  const lossStatus = getLossLimitStatus()
  const exclusionDays = getSelfExclusionRemaining()

  const handleSetSessionLimit = () => {
    setSessionLimits(sessionMinutes)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleSetDepositLimit = () => {
    // In production, call API
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleSetLossLimit = () => {
    setLossLimit(lossLimit)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleSelfExclude = () => {
    setSelfExclusion(selfExclusionDays)
    alert(`Account will be self-excluded for ${selfExclusionDays} days.`)
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6 flex gap-3">
        <AlertCircle size={20} className="text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-foreground mb-1">Responsible Gaming</p>
          <p className="text-sm text-muted-foreground">
            Set limits on your betting activity to ensure responsible gaming practices.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {[
          { id: "session", label: "Session Limit", icon: Clock },
          { id: "deposit", label: "Deposit Limit", icon: DollarSign },
          { id: "loss", label: "Loss Limit", icon: AlertCircle },
          { id: "exclude", label: "Self Exclude", icon: Ban },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 flex items-center gap-2 font-semibold transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-secondary text-secondary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Session Limit */}
      {activeTab === "session" && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <p className="font-semibold text-foreground mb-4">Session Time Limit</p>
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Current Session Time Remaining</p>
              <p className="text-2xl font-bold text-secondary">
                {sessionTime.minutes}m {sessionTime.seconds}s
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Set Session Limit (minutes)</label>
            <input
              type="number"
              min="15"
              max="480"
              step="15"
              value={sessionMinutes}
              onChange={(e) => setSessionMinutes(Number.parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <p className="text-xs text-muted-foreground mt-2">
              You will be automatically logged out after this duration.
            </p>
          </div>

          <button
            onClick={handleSetSessionLimit}
            className="w-full px-4 py-2 bg-secondary text-primary rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
          >
            Save Session Limit
          </button>
        </div>
      )}

      {/* Deposit Limit */}
      {activeTab === "deposit" && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <p className="font-semibold text-foreground mb-4">Daily Deposit Limit</p>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Maximum Daily Deposit Amount</label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 py-2 bg-muted border border-border rounded-lg">$</span>
              <input
                type="number"
                min="10"
                step="10"
                value={depositLimit}
                onChange={(e) => setDepositLimit(Number.parseInt(e.target.value))}
                className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              You will not be able to deposit more than this amount per day.
            </p>
          </div>

          <button
            onClick={handleSetDepositLimit}
            className="w-full px-4 py-2 bg-secondary text-primary rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
          >
            Save Deposit Limit
          </button>
        </div>
      )}

      {/* Loss Limit */}
      {activeTab === "loss" && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <p className="font-semibold text-foreground mb-4">Monthly Loss Limit</p>

          <div className="mb-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Current Month Status</p>
            <div className="flex justify-between items-center mb-2">
              <span className="text-foreground">Limit: ${lossStatus.limit}</span>
              <span className="text-destructive font-bold">Spent: ${lossStatus.spent}</span>
            </div>
            <div className="w-full h-2 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full ${lossStatus.exceedsLimit ? "bg-destructive" : "bg-secondary"}`}
                style={{ width: `${Math.min(100, (lossStatus.spent / lossStatus.limit) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Remaining: ${lossStatus.remaining}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Set Monthly Loss Limit</label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 py-2 bg-muted border border-border rounded-lg">$</span>
              <input
                type="number"
                min="50"
                step="50"
                value={lossLimit}
                onChange={(e) => setLossLimit(Number.parseInt(e.target.value))}
                className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
          </div>

          <button
            onClick={handleSetLossLimit}
            className="w-full px-4 py-2 bg-secondary text-primary rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
          >
            Save Loss Limit
          </button>
        </div>
      )}

      {/* Self Exclusion */}
      {activeTab === "exclude" && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <p className="font-semibold text-foreground mb-4">Self Exclusion</p>

          {exclusionDays > 0 && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg mb-4">
              <p className="text-sm font-semibold text-destructive mb-1">Account Self-Excluded</p>
              <p className="text-xs text-muted-foreground">
                Your account is self-excluded for {exclusionDays} more days.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Self Exclude for (days)</label>
            <select
              value={selfExclusionDays}
              onChange={(e) => setSelfExclusionDays(Number.parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>6 months</option>
              <option value={365}>1 year</option>
            </select>
            <p className="text-xs text-muted-foreground mt-2">
              During exclusion, you will not be able to access your account or place bets.
            </p>
          </div>

          <button
            onClick={handleSelfExclude}
            className="w-full px-4 py-2 bg-destructive text-white rounded-lg font-semibold hover:bg-destructive/80 transition-colors"
          >
            Activate Self Exclusion
          </button>
        </div>
      )}

      {saved && <p className="text-sm text-green-500 text-center mt-4">Settings saved successfully!</p>}
    </div>
  )
}
