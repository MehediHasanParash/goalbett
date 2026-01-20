"use client"
import { Card3D } from "./3d-card"
import { Gamepad2, Trophy, Zap, Shield, Coins, Users } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: Gamepad2,
      title: "Immersive Gaming",
      description: "Experience casino games like never before with stunning 3D graphics and smooth animations",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Trophy,
      title: "Tournament Mode",
      description: "Compete with players worldwide in exciting tournaments with massive prize pools",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: Zap,
      title: "Instant Payouts",
      description: "Lightning-fast withdrawals and deposits with multiple payment methods including crypto",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Bank-level security with advanced encryption to protect your funds and personal data",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Coins,
      title: "Bonus Rewards",
      description: "Daily bonuses, loyalty rewards, and special promotions to maximize your winnings",
      color: "from-red-500 to-rose-500",
    },
    {
      icon: Users,
      title: "Live Community",
      description: "Join a vibrant community of players with live chat and social features",
      color: "from-indigo-500 to-blue-500",
    },
  ]

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-5xl font-bold gradient-text mb-6">Why Choose Goal Betting?</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover the features that make our platform the ultimate destination for sports betting and casino gaming
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card3D key={index} className="group">
              <div
                className="glass p-8 rounded-2xl h-full hover:bg-white/5 transition-all duration-500 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </Card3D>
          ))}
        </div>
      </div>
    </section>
  )
}
