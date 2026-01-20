"use client"
import { useState } from "react"
import { Play, Pause } from "lucide-react"
import { AnimatedButton } from "./animated-button"
import { Card3D } from "./3d-card"

export function HeroSection() {
  const [isPlaying, setIsPlaying] = useState(true)

  const stats = [
    { label: "Active Players", value: "50K+", icon: "👥" },
    { label: "Games Won", value: "1M+", icon: "🏆" },
    { label: "Total Payouts", value: "$10M+", icon: "💰" },
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-slate-900 to-slate-800">
        <div className="absolute inset-0 bg-[url('/abstract-sports-betting-background.jpg')] opacity-10 bg-cover bg-center" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Main Title */}
          <div className="space-y-6 animate-slide-up">
            <h1 className="text-7xl md:text-9xl font-bold leading-tight">
              <span className="block gradient-text">IMMERSIVE</span>
              <span className="block text-foreground">BETTING</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Experience the future of sports betting with cutting-edge 3D graphics, real-time odds, and immersive
              gameplay that puts you right in the action.
            </p>
          </div>

          {/* 3D Interactive Element */}
          <div className="relative animate-scale-in" style={{ animationDelay: "0.3s" }}>
            <Card3D className="mx-auto w-80 h-80">
              <div className="relative w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl glass overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-8xl animate-spin-slow">⚽</div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center justify-between text-white">
                    <span className="font-bold">LIVE MATCH</span>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </Card3D>
          </div>

          {/* Action Buttons */}
          <div
            className="flex flex-col sm:flex-row gap-6 justify-center animate-slide-up"
            style={{ animationDelay: "0.6s" }}
          >
            <AnimatedButton variant="primary" size="lg" onClick={() => (window.location.href = "/auth")}>
              Start Playing Now
            </AnimatedButton>
            <AnimatedButton variant="glass" size="lg" onClick={() => (window.location.href = "/games")}>
              Explore Games
            </AnimatedButton>
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 animate-slide-up"
            style={{ animationDelay: "0.9s" }}
          >
            {stats.map((stat, index) => (
              <Card3D key={index} className="group">
                <div className="glass p-8 rounded-2xl text-center hover:bg-white/10 transition-all duration-300">
                  <div className="text-4xl mb-4 group-hover:animate-bounce">{stat.icon}</div>
                  <div className="text-3xl font-bold gradient-text mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              </Card3D>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
