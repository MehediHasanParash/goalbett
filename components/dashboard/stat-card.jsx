import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

export function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color = "bg-[#FFD700]",
  textColor = "text-[#0A1A2F]",
}) {
  const isPositive = trend === "up"

  return (
    <Card className="bg-[#0D1F35]/80 border border-[#2A3F55] hover:border-[#FFD700] transition-all">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className={`h-6 w-6 ${textColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#B8C5D6] text-sm truncate">{title}</p>
          <p className="text-2xl font-bold text-[#F5F5F5] mt-1">{value}</p>
          {change && (
            <div className={`flex items-center text-xs mt-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
              {isPositive ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
              {change}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
