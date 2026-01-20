"use client"
import { useState } from "react"
import { Check } from "lucide-react"
import { AuthLayout } from "@/components/ui/auth-layout"
import { AnimatedButton } from "@/components/ui/animated-button"

const avatars = [
  { id: 1, emoji: "👨‍💼", name: "Business" },
  { id: 2, emoji: "👩‍💻", name: "Tech" },
  { id: 3, emoji: "🧑‍🎨", name: "Creative" },
  { id: 4, emoji: "👨‍🏫", name: "Academic" },
  { id: 5, emoji: "👩‍⚕️", name: "Medical" },
  { id: 6, emoji: "🧑‍🍳", name: "Chef" },
  { id: 7, emoji: "👨‍🎤", name: "Musician" },
  { id: 8, emoji: "👩‍🚀", name: "Astronaut" },
  { id: 9, emoji: "🧑‍🎯", name: "Sports" },
  { id: 10, emoji: "👨‍🎮", name: "Gamer" },
  { id: 11, emoji: "👩‍🎭", name: "Artist" },
  { id: 12, emoji: "🧑‍🔬", name: "Scientist" },
]

export default function SelectAvatarPage() {
  const [selectedAvatar, setSelectedAvatar] = useState(null)

  const handleSave = () => {
    console.log("Selected avatar:", selectedAvatar)
    window.location.href = "/dashboard"
  }

  return (
    <AuthLayout
      title="Choose an avatar"
      subtitle="Pick an avatar that represents you"
      showBack={true}
      onBack={() => (window.location.href = "/auth/reset-password")}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {avatars.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => setSelectedAvatar(avatar)}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105
                ${
                  selectedAvatar?.id === avatar.id
                    ? "border-primary bg-primary/10 neon-green"
                    : "border-border bg-card/50 hover:border-primary/50"
                }
              `}
            >
              <div className="text-3xl mb-2">{avatar.emoji}</div>
              <div className="text-xs text-muted-foreground">{avatar.name}</div>
              {selectedAvatar?.id === avatar.id && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>

        <AnimatedButton variant="primary" size="lg" className="w-full" onClick={handleSave} disabled={!selectedAvatar}>
          Save
        </AnimatedButton>

        <div className="text-center">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}
