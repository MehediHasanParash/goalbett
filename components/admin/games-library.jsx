"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Gamepad2, Star, Users, TrendingUp } from "lucide-react"

const games = [
  { id: 1, name: "Mega Fortune", provider: "NetEnt", type: "Slots", rtp: 96.6, status: "active", players: 1250 },
  { id: 2, name: "Starburst", provider: "NetEnt", type: "Slots", rtp: 96.1, status: "active", players: 2340 },
  { id: 3, name: "Book of Dead", provider: "Play'n GO", type: "Slots", rtp: 96.2, status: "active", players: 1890 },
  {
    id: 4,
    name: "Lightning Roulette",
    provider: "Evolution",
    type: "Live Casino",
    rtp: 97.3,
    status: "active",
    players: 890,
  },
  { id: 5, name: "Crazy Time", provider: "Evolution", type: "Game Show", rtp: 95.5, status: "active", players: 3200 },
  { id: 6, name: "Sweet Bonanza", provider: "Pragmatic", type: "Slots", rtp: 96.5, status: "inactive", players: 0 },
]

export function GamesLibrary() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredGames = games.filter(
    (game) =>
      game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.provider.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#FFD700]/20">
              <Gamepad2 className="h-6 w-6 text-[#FFD700]" />
            </div>
            <div>
              <p className="text-[#B8C5D6] text-sm">Total Games</p>
              <p className="text-2xl font-bold text-[#F5F5F5]">{games.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/20">
              <Star className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-[#B8C5D6] text-sm">Active Games</p>
              <p className="text-2xl font-bold text-[#F5F5F5]">{games.filter((g) => g.status === "active").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-[#B8C5D6] text-sm">Active Players</p>
              <p className="text-2xl font-bold text-[#F5F5F5]">
                {games.reduce((sum, g) => sum + g.players, 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/20">
              <TrendingUp className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-[#B8C5D6] text-sm">Avg RTP</p>
              <p className="text-2xl font-bold text-[#F5F5F5]">
                {(games.reduce((sum, g) => sum + g.rtp, 0) / games.length).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8C5D6]" />
          <Input
            placeholder="Search games..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#0D1F35] border-[#2A3F55] text-[#F5F5F5]"
          />
        </div>
        <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]">
          <Plus className="w-4 h-4 mr-2" />
          Add Game
        </Button>
      </div>

      {/* Games Table */}
      <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
        <CardHeader>
          <CardTitle className="text-[#FFD700]">All Games</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A3F55]">
                  <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Game</th>
                  <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Provider</th>
                  <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">RTP</th>
                  <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Players</th>
                  <th className="text-left py-3 px-4 text-[#B8C5D6] font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredGames.map((game) => (
                  <tr key={game.id} className="border-b border-[#2A3F55]/50 hover:bg-[#1A2F45]/50">
                    <td className="py-3 px-4 text-[#F5F5F5] font-medium">{game.name}</td>
                    <td className="py-3 px-4 text-[#B8C5D6]">{game.provider}</td>
                    <td className="py-3 px-4">
                      <Badge className="bg-blue-500/20 text-blue-400">{game.type}</Badge>
                    </td>
                    <td className="py-3 px-4 text-[#FFD700]">{game.rtp}%</td>
                    <td className="py-3 px-4 text-[#B8C5D6]">{game.players.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <Badge
                        className={
                          game.status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }
                      >
                        {game.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
