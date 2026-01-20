"use client"

import { useLowBandwidth } from "@/lib/contexts/low-bandwidth-context"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Zap, ZapOff, Wifi, WifiOff, ImageIcon, ImageOff, Play, Square } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function LowBandwidthToggle({ variant = "icon", showSettings = false }) {
  const { isLowBandwidth, toggleLowBandwidth, settings, updateSettings } = useLowBandwidth()

  if (variant === "switch") {
    return (
      <div className="flex items-center gap-3">
        <Switch id="low-bandwidth" checked={isLowBandwidth} onCheckedChange={toggleLowBandwidth} />
        <Label htmlFor="low-bandwidth" className="flex items-center gap-2 cursor-pointer">
          {isLowBandwidth ? <ZapOff className="h-4 w-4 text-yellow-500" /> : <Zap className="h-4 w-4" />}
          <span>Low Bandwidth Mode</span>
        </Label>
      </div>
    )
  }

  if (variant === "full") {
    return (
      <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLowBandwidth ? (
              <WifiOff className="h-5 w-5 text-yellow-500" />
            ) : (
              <Wifi className="h-5 w-5 text-green-500" />
            )}
            <div>
              <p className="font-medium">Low Bandwidth Mode</p>
              <p className="text-sm text-muted-foreground">
                {isLowBandwidth ? "Optimized for slow connections" : "Full experience enabled"}
              </p>
            </div>
          </div>
          <Switch checked={isLowBandwidth} onCheckedChange={toggleLowBandwidth} />
        </div>

        {isLowBandwidth && showSettings && (
          <div className="space-y-3 pt-3 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground">Optimization Settings</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Square className="h-4 w-4" />
                <span className="text-sm">Disable Animations</span>
              </div>
              <Switch
                checked={settings.disableAnimations}
                onCheckedChange={(v) => updateSettings({ disableAnimations: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageOff className="h-4 w-4" />
                <span className="text-sm">Hide Non-Essential Images</span>
              </div>
              <Switch checked={settings.disableImages} onCheckedChange={(v) => updateSettings({ disableImages: v })} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                <span className="text-sm">Disable Auto-Play Videos</span>
              </div>
              <Switch checked={settings.disableVideos} onCheckedChange={(v) => updateSettings({ disableVideos: v })} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm">Reduced Image Quality</span>
              </div>
              <Switch
                checked={settings.reducedQuality}
                onCheckedChange={(v) => updateSettings({ reducedQuality: v })}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Icon variant with dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {isLowBandwidth ? <ZapOff className="h-5 w-5 text-yellow-500" /> : <Zap className="h-5 w-5" />}
          {isLowBandwidth && <span className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-500 rounded-full" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Bandwidth Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm">Low Bandwidth Mode</span>
            <Switch checked={isLowBandwidth} onCheckedChange={toggleLowBandwidth} />
          </div>
          {isLowBandwidth && (
            <p className="text-xs text-muted-foreground">Animations disabled, images optimized for slow connections</p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
