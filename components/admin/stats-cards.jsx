"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Users, Wallet, Gamepad2, AlertTriangle } from "lucide-react"

const statsData = [
  {
    title: "Total Revenue",
    value: "$124,563",
    change: "+12.5%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    title: "Active Players",
    value: "2,847",
    change: "+8.2%",
    trend: "up",
    icon: Users,
  },
  {
    title: "Total Bets",
    value: "15,234",
    change: "-2.1%",
    trend: "down",
    icon: Gamepad2,
  },
  {
    title: "Wallet Balance",
    value: "$89,432",
    change: "+5.7%",
    trend: "up",
    icon: Wallet,
  },
  {
    title: "Active Agents",
    value: "156",
    change: "+3.4%",
    trend: "up",
    icon: Users,
  },
  {
    title: "Risk Alerts",
    value: "7",
    change: "-15.3%",
    trend: "down",
    icon: AlertTriangle,
  },
]

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon
        const isPositive = stat.trend === "up"

        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className={`flex items-center text-xs ${isPositive ? "text-green-500" : "text-red-500"}`}>
                {isPositive ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                {stat.change} from last month
              </div>
            </CardContent>

            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
          </Card>
        )
      })}
    </div>
  )
}
