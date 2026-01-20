"use client"
import { Card3D } from "./3d-card"
import { Star } from "lucide-react"

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Alex Johnson",
      avatar: "👨‍💼",
      rating: 5,
      text: "The 3D graphics and smooth gameplay are incredible. I've never experienced anything like this in online betting!",
      winnings: "$15,420",
    },
    {
      name: "Sarah Chen",
      avatar: "👩‍💻",
      rating: 5,
      text: "Fast payouts and amazing customer service. The tournament mode is my favorite feature!",
      winnings: "$8,750",
    },
    {
      name: "Mike Rodriguez",
      avatar: "🧑‍🎨",
      rating: 5,
      text: "Been playing for 6 months now. The platform is secure, fair, and the bonuses are generous.",
      winnings: "$22,100",
    },
  ]

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-5xl font-bold gradient-text mb-6">What Players Say</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join thousands of satisfied players who have made Goal Betting their favorite gaming destination
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card3D key={index} className="group">
              <div
                className="glass p-8 rounded-2xl h-full hover:bg-white/5 transition-all duration-500 animate-slide-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4 text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold">{testimonial.name}</h4>
                    <div className="flex items-center gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div className="text-center">
                  <div className="text-2xl font-bold gradient-text">{testimonial.winnings}</div>
                  <div className="text-sm text-muted-foreground">Total Winnings</div>
                </div>
              </div>
            </Card3D>
          ))}
        </div>
      </div>
    </section>
  )
}
