"use client"

export function FloatingElements() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Floating Geometric Shapes */}
      <div
        className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full animate-float"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="absolute top-40 right-20 w-16 h-16 bg-accent/10 rounded-lg rotate-45 animate-float"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute bottom-40 left-20 w-12 h-12 bg-secondary/10 rounded-full animate-float"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-20 right-40 w-24 h-24 bg-neon-purple/10 rounded-lg animate-float"
        style={{ animationDelay: "0.5s" }}
      />

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-xl animate-pulse-glow" />
      <div
        className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-r from-secondary/20 to-neon-purple/20 rounded-full blur-xl animate-pulse-glow"
        style={{ animationDelay: "1s" }}
      />
    </div>
  )
}
