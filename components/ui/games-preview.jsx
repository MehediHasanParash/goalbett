"use client"
import { Card3D } from "./3d-card"
import { AnimatedButton } from "./animated-button"

export function GamesPreview() {
  const games = [
    {
      title: "Spin Wheel",
      description: "Test your luck with our exciting spin wheel game",
      image: "/casino-spin-wheel.jpg",
      category: "Luck",
      players: "2.5K",
    },
    {
      title: "Slot Machine",
      description: "Classic slots with modern twists and huge jackpots",
      image: "/slot-machine-casino.png",
      category: "Slots",
      players: "5.2K",
    },
    {
      title: "Roulette",
      description: "European and American roulette with live dealers",
      image: "/casino-roulette-table.jpg",
      category: "Table",
      players: "1.8K",
    },
    {
      title: "Sports Betting",
      description: "Bet on live matches with real-time odds",
      image: "/sports-betting-interface.jpg",
      category: "Sports",
      players: "8.1K",
    },
  ]

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-5xl font-bold gradient-text mb-6">Featured Games</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore our collection of premium games designed for the ultimate gaming experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {games.map((game, index) => (
            <Card3D key={index} className="group">
              <div
                className="glass rounded-2xl overflow-hidden hover:bg-white/5 transition-all duration-500 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={game.image || "/placeholder.svg"}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-primary/80 text-primary-foreground text-xs font-medium rounded-full">
                      {game.category}
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-full">
                      {game.players} playing
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{game.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{game.description}</p>
                  <AnimatedButton variant="glass" size="sm" className="w-full">
                    Play Now
                  </AnimatedButton>
                </div>
              </div>
            </Card3D>
          ))}
        </div>

        <div className="text-center">
          <AnimatedButton variant="primary" size="lg" onClick={() => (window.location.href = "/games")}>
            View All Games
          </AnimatedButton>
        </div>
      </div>
    </section>
  )
}
