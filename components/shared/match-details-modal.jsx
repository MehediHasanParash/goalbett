"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Calendar } from "lucide-react"
import { useBetSlip } from "@/hooks/useBetSlip"

export function MatchDetailsModal({ match, isOpen, onClose, language = "en" }) {
  const { addSelection, isInBetslip } = useBetSlip()

  if (!match) return null

  const homeTeam = match.homeTeam?.name || match.homeTeam || "TBD"
  const awayTeam = match.awayTeam?.name || match.awayTeam || "TBD"
  const league = match.league?.name || match.league || "League"
  const status = match.status || "upcoming"
  const isLive = status.toLowerCase() === "live"

  // All available markets for the match
  const markets = [
    {
      id: "1x2",
      name: language === "es" ? "Ganador del Partido" : "Match Winner",
      options: [
        { selection: homeTeam, odds: match.odds?.home || "0.00", type: "1" },
        { selection: language === "es" ? "Empate" : "Draw", odds: match.odds?.draw || "0.00", type: "X" },
        { selection: awayTeam, odds: match.odds?.away || "0.00", type: "2" },
      ],
    },
    {
      id: "over_under",
      name: language === "es" ? "Más/Menos 2.5 Goles" : "Over/Under 2.5 Goals",
      options: [
        { selection: language === "es" ? "Más de 2.5" : "Over 2.5", odds: "1.95", type: "over" },
        { selection: language === "es" ? "Menos de 2.5" : "Under 2.5", odds: "1.90", type: "under" },
      ],
    },
    {
      id: "btts",
      name: language === "es" ? "Ambos Equipos Marcan" : "Both Teams to Score",
      options: [
        { selection: language === "es" ? "Sí" : "Yes", odds: "2.10", type: "yes" },
        { selection: language === "es" ? "No" : "No", odds: "1.78", type: "no" },
      ],
    },
    {
      id: "double_chance",
      name: language === "es" ? "Doble Oportunidad" : "Double Chance",
      options: [
        { selection: `${homeTeam} ${language === "es" ? "o Empate" : "or Draw"}`, odds: "1.58", type: "1x" },
        { selection: `${awayTeam} ${language === "es" ? "o Empate" : "or Draw"}`, odds: "1.72", type: "x2" },
        { selection: `${homeTeam} ${language === "es" ? "o" : "or"} ${awayTeam}`, odds: "1.38", type: "12" },
      ],
    },
  ]

  const addToBetslip = (market, option) => {
    const selection = {
      eventId: match._id || match.id,
      eventName: `${homeTeam} vs ${awayTeam}`,
      market: market.name,
      selection: option.selection,
      odds: typeof option.odds === "string" ? Number.parseFloat(option.odds) : option.odds,
      sportId: match.sportId,
      leagueId: match.leagueId,
    }
    addSelection(selection)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0D1F35] border border-[#2A3F55] text-[#F5F5F5] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-[#2A3F55] pb-4">
          <DialogTitle className="text-2xl font-bold text-[#FFD700]">
            {language === "es" ? "Detalles del Partido" : "Match Details"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Match Header */}
          <div className="bg-gradient-to-r from-[#1A2F45]/80 to-[#1A2F45]/60 rounded-xl p-6 border border-[#2A3F55]">
            <div className="flex items-center justify-between mb-4">
              <Badge
                className={`${isLive ? "bg-red-500 text-white animate-pulse" : "bg-secondary text-secondary-foreground"} text-xs px-3 py-1 font-bold uppercase`}
              >
                {isLive ? (language === "es" ? "EN VIVO" : "LIVE") : language === "es" ? "PRÓXIMO" : "UPCOMING"}
              </Badge>
              <div className="flex items-center gap-3 text-xs text-[#B8C5D6]">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {match.startTime
                    ? new Date(match.startTime).toLocaleString(language, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "TBD"}
                </div>
              </div>
            </div>

            <div className="text-center space-y-3">
              <h3 className="text-2xl font-bold text-[#F5F5F5]">
                {homeTeam} <span className="text-[#FFD700]">vs</span> {awayTeam}
              </h3>
              <p className="text-sm text-[#B8C5D6]">{league}</p>
              {isLive && match.homeTeam?.score !== undefined && (
                <div className="flex items-center justify-center gap-4 text-3xl font-bold text-[#FFD700]">
                  <span>{match.homeTeam.score}</span>
                  <span className="text-[#B8C5D6]">:</span>
                  <span>{match.awayTeam.score}</span>
                </div>
              )}
            </div>
          </div>

          {/* Markets Grid */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-[#FFD700]">
              {language === "es" ? "Mercados Disponibles" : "Available Markets"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {markets.map((market) => (
                <div
                  key={market.id}
                  className="bg-[#1A2F45]/50 border border-[#2A3F55] rounded-lg p-4 hover:border-[#FFD700]/50 transition-all"
                >
                  <h5 className="text-sm font-semibold text-[#FFD700] mb-3">{market.name}</h5>
                  <div className="space-y-2">
                    {market.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => addToBetslip(market, option)}
                        className={`w-full p-3 rounded-lg border-2 transition-all ${
                          isInBetslip(match._id || match.id)
                            ? "bg-secondary/20 border-secondary"
                            : "bg-[#0D1F35] border-[#2A3F55] hover:bg-secondary/10 hover:border-secondary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[#F5F5F5] text-sm font-medium">{option.selection}</span>
                          <span className="text-[#FFD700] text-lg font-bold">{option.odds}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          {isLive && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-300 font-bold text-sm mb-1">
                  {language === "es" ? "Actualización de Cuotas en Vivo" : "Live Odds Update"}
                </p>
                <p className="text-yellow-200 text-xs">
                  {language === "es"
                    ? "Las cuotas se actualizan en tiempo real. El precio de tu boleto se bloquea cuando agregas selecciones."
                    : "Odds update in real-time. Your betslip price is locked when you add selections."}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
