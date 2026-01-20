"use client"

import { useState } from "react"
import { Upload, Plus, Search, Power } from "lucide-react"
import GamesBulkUploader from "./games-bulk-uploader"
import GamesSingleUploader from "./games-single-uploader"
import GameControl from "./game-control"

export default function GamesLibrary() {
  const [games, setGames] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadMode, setUploadMode] = useState(null) // 'single', 'bulk', or null
  const [activeTab, setActiveTab] = useState("upload")

  const handleSingleUploadComplete = (game) => {
    setGames([...games, game])
    setUploadMode(null)
  }

  const handleBulkUploadComplete = (count) => {
    alert(`Successfully uploaded ${count} games!`)
    setUploadMode(null)
  }

  const filteredGames = games.filter(
    (game) =>
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.provider.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="w-full">
      {/* Header with Tabs */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">Games Library Management</h2>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-border mb-6">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === "upload"
                ? "border-b-2 border-secondary text-secondary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload size={18} />
            Upload Games
          </button>
          <button
            onClick={() => setActiveTab("control")}
            className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === "control"
                ? "border-b-2 border-secondary text-secondary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Power size={18} />
            Game Control
          </button>
        </div>
      </div>

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <div>
          <div className="flex gap-3 flex-wrap mb-6">
            <div className="flex-1 min-w-64 relative">
              <Search size={18} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search games or providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setUploadMode("single")}
                className="px-4 py-2 border border-secondary text-secondary rounded-lg font-semibold hover:bg-secondary/10 transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                Single Game
              </button>
              <button
                onClick={() => setUploadMode("bulk")}
                className="px-4 py-2 bg-secondary text-primary rounded-lg font-semibold hover:bg-secondary/80 transition-colors flex items-center gap-2"
              >
                <Upload size={18} />
                Bulk Upload
              </button>
            </div>
          </div>

          {/* Games Grid */}
          {uploadMode === null && (
            <>
              {games.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No games uploaded yet</p>
                  <button
                    onClick={() => setUploadMode("single")}
                    className="px-4 py-2 border border-secondary text-secondary rounded-lg hover:bg-secondary/10 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Plus size={18} />
                    Add Your First Game
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredGames.map((game) => (
                    <div
                      key={game.id}
                      className="bg-card border border-border rounded-lg overflow-hidden hover:border-secondary/50 transition-colors"
                    >
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        <span className="text-4xl">🎮</span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground mb-1 truncate">{game.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{game.provider}</p>
                        <div className="flex justify-between text-xs mb-3">
                          <span className="px-2 py-1 bg-muted rounded text-muted-foreground">RTP: {game.rtp}%</span>
                          <span className="px-2 py-1 bg-muted rounded text-muted-foreground">{game.volatility}</span>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 px-2 py-1 bg-secondary text-primary rounded text-sm font-semibold hover:bg-secondary/80 transition-colors">
                            Preview
                          </button>
                          <button className="flex-1 px-2 py-1 border border-secondary text-secondary rounded text-sm hover:bg-secondary/10 transition-colors">
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Upload Modals */}
          {uploadMode === "single" && (
            <GamesSingleUploader onComplete={handleSingleUploadComplete} onClose={() => setUploadMode(null)} />
          )}

          {uploadMode === "bulk" && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="bg-card border border-border rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Bulk Upload Games</h2>
                  <button onClick={() => setUploadMode(null)} className="text-muted-foreground hover:text-foreground">
                    ✕
                  </button>
                </div>
                <GamesBulkUploader onUploadComplete={handleBulkUploadComplete} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game Control Tab */}
      {activeTab === "control" && <GameControl />}
    </div>
  )
}
