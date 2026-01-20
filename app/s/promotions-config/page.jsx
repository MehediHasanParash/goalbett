"use client"

import { useState } from "react"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Code, ToggleRight, ToggleLeft, Save } from "lucide-react"

export default function PromotionsConfigPage() {
  const [promotions, setPromotions] = useState({
    oneGameCut: {
      enabled: true,
      minOdds: 1.5,
      maxCutPercentage: 50,
      eligibleSports: ["football", "basketball"],
    },
    welcomeBonus: {
      enabled: true,
      percentage: 100,
      maxAmount: 1000,
      wageringRequirement: 5,
    },
    freeBets: {
      enabled: false,
      amount: 10,
      minOdds: 1.8,
    },
  })

  return (
    <SuperAdminLayout
      title="Promotions Configuration"
      description="Manage global promotion settings and one-game-cut configuration"
    >
      <Tabs defaultValue="ui" className="space-y-6">
        <TabsList className="bg-[#0D1F35]/80 border border-[#2A3F55]">
          <TabsTrigger value="ui" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <Settings className="mr-2 h-4 w-4" />
            UI Editor
          </TabsTrigger>
          <TabsTrigger value="json" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-[#0A1A2F]">
            <Code className="mr-2 h-4 w-4" />
            JSON
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ui" className="space-y-6">
          {/* One Game Cut */}
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-[#FFD700]">One-Game-Cut</CardTitle>
              <button
                onClick={() =>
                  setPromotions({
                    ...promotions,
                    oneGameCut: { ...promotions.oneGameCut, enabled: !promotions.oneGameCut.enabled },
                  })
                }
                className="text-[#FFD700]"
              >
                {promotions.oneGameCut.enabled ? (
                  <ToggleRight className="h-8 w-8" />
                ) : (
                  <ToggleLeft className="h-8 w-8" />
                )}
              </button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Minimum Odds</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={promotions.oneGameCut.minOdds}
                  onChange={(e) =>
                    setPromotions({
                      ...promotions,
                      oneGameCut: { ...promotions.oneGameCut, minOdds: Number.parseFloat(e.target.value) },
                    })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Max Cut Percentage</Label>
                <Input
                  type="number"
                  value={promotions.oneGameCut.maxCutPercentage}
                  onChange={(e) =>
                    setPromotions({
                      ...promotions,
                      oneGameCut: { ...promotions.oneGameCut, maxCutPercentage: Number.parseInt(e.target.value) },
                    })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Welcome Bonus */}
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-[#FFD700]">Welcome Bonus</CardTitle>
              <button
                onClick={() =>
                  setPromotions({
                    ...promotions,
                    welcomeBonus: { ...promotions.welcomeBonus, enabled: !promotions.welcomeBonus.enabled },
                  })
                }
                className="text-[#FFD700]"
              >
                {promotions.welcomeBonus.enabled ? (
                  <ToggleRight className="h-8 w-8" />
                ) : (
                  <ToggleLeft className="h-8 w-8" />
                )}
              </button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Bonus Percentage</Label>
                <Input
                  type="number"
                  value={promotions.welcomeBonus.percentage}
                  onChange={(e) =>
                    setPromotions({
                      ...promotions,
                      welcomeBonus: { ...promotions.welcomeBonus, percentage: Number.parseInt(e.target.value) },
                    })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Max Amount</Label>
                <Input
                  type="number"
                  value={promotions.welcomeBonus.maxAmount}
                  onChange={(e) =>
                    setPromotions({
                      ...promotions,
                      welcomeBonus: { ...promotions.welcomeBonus, maxAmount: Number.parseInt(e.target.value) },
                    })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#B8C5D6]">Wagering Requirement (x)</Label>
                <Input
                  type="number"
                  value={promotions.welcomeBonus.wageringRequirement}
                  onChange={(e) =>
                    setPromotions({
                      ...promotions,
                      welcomeBonus: {
                        ...promotions.welcomeBonus,
                        wageringRequirement: Number.parseInt(e.target.value),
                      },
                    })
                  }
                  className="bg-[#1A2F45] border-[#2A3F55] text-[#F5F5F5]"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#0A1A2F]">
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="json">
          <Card className="bg-[#0D1F35]/80 border-[#2A3F55]">
            <CardHeader>
              <CardTitle className="text-[#FFD700]">JSON Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-[#1A2F45] p-4 rounded-lg overflow-x-auto text-[#B8C5D6] text-sm">
                {JSON.stringify(promotions, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </SuperAdminLayout>
  )
}
