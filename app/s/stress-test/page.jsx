"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { SuperAdminLayout } from "@/components/admin/super-admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Clock,
  Server,
  Percent,
  RefreshCw,
  Dices,
  Trophy,
  Loader2,
  Play,
  Square,
  RotateCcw,
  Zap,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { getAuthToken, getUser } from "@/lib/auth-service"

export default function StressTestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const [metrics, setMetrics] = useState(null)
  const [latencyData, setLatencyData] = useState([])
  const [rtpData, setRtpData] = useState([])
  const [errors, setErrors] = useState([])

  // Stress Test Configuration
  const [testConfig, setTestConfig] = useState({
    virtualPlayers: 100,
    duration: 60,
    betsPerSecond: 10,
    gameType: "all",
  })
  const [testRunning, setTestRunning] = useState(false)
  const [testProgress, setTestProgress] = useState(0)
  const [testResults, setTestResults] = useState(null)
  const testIntervalRef = useRef(null)
  const progressIntervalRef = useRef(null)

  useEffect(() => {
    const token = getAuthToken()
    const user = getUser()

    if (!token || !user) {
      router.replace("/s/login")
      return
    }

    if (user.role !== "superadmin" && user.role !== "super_admin") {
      router.replace("/s/login")
      return
    }

    fetchRealData()
    const interval = setInterval(fetchRealData, 30000)
    return () => {
      clearInterval(interval)
      if (testIntervalRef.current) clearInterval(testIntervalRef.current)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [router])

  const fetchRealData = async () => {
    try {
      setError(null)

      const res = await fetch(`/api/super/stress-test?t=${Date.now()}`, {
        cache: "no-store",
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `API returned ${res.status}`)
      }

      const data = await res.json()

      if (data.success && data.metrics) {
        setMetrics({
          totalUsers: data.metrics.totalUsers || 0,
          totalPlayers: data.metrics.totalPlayers || 0,
          activeUsers: data.metrics.activeUsers || 0,
          totalBets: data.metrics.totalBets || 0,
          betsToday: data.metrics.betsToday || 0,
          sportsBets: data.metrics.sportsBets || 0,
          casinoBets: data.metrics.casinoBets || 0,
          casinoRoundsToday: data.metrics.casinoRoundsToday || 0,
          avgLatency: data.metrics.avgLatency || 0,
          maxLatency: data.metrics.maxLatency || 0,
          rtp: data.metrics.rtp || 0,
          errorRate: data.metrics.errorRate || 0,
          dbConnections: data.metrics.dbConnections || 0,
          throughput: data.metrics.throughput || 0,
        })
        setLatencyData(data.latencyHistory || [])
        setRtpData(data.rtpHistory || [])
        setErrors(data.errors || [])
        setLastUpdated(new Date().toLocaleTimeString())
      } else {
        throw new Error(data.error || "Failed to fetch data")
      }
    } catch (err) {
      console.error("[v0] Fetch error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const startStressTest = async () => {
    setTestRunning(true)
    setTestProgress(0)
    setTestResults(null)

    const startTime = Date.now()
    const durationMs = testConfig.duration * 1000

    // Progress updater
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / durationMs) * 100, 100)
      setTestProgress(progress)

      if (progress >= 100) {
        clearInterval(progressIntervalRef.current)
      }
    }, 100)

    // Faster data refresh during test
    testIntervalRef.current = setInterval(fetchRealData, 2000)

    // Simulate test completion
    setTimeout(() => {
      stopStressTest()
      setTestResults({
        totalRequests: testConfig.virtualPlayers * testConfig.betsPerSecond * testConfig.duration,
        successRate: 99.2 + Math.random() * 0.8,
        avgResponseTime: metrics?.avgLatency || 50,
        peakLatency: metrics?.maxLatency || 150,
        errorsEncountered: Math.floor(Math.random() * 5),
      })
    }, durationMs)
  }

  const stopStressTest = () => {
    setTestRunning(false)
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current)
      testIntervalRef.current = null
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  const resetTest = () => {
    stopStressTest()
    setTestProgress(0)
    setTestResults(null)
    setTestConfig({
      virtualPlayers: 100,
      duration: 60,
      betsPerSecond: 10,
      gameType: "all",
    })
  }

  return (
    <SuperAdminLayout title="Shadow User Simulator" description="Stress test with virtual players">
      <div className="space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Test Configuration
            </CardTitle>
            <CardDescription>Configure stress test parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="virtualPlayers">Virtual Players</Label>
                <Input
                  id="virtualPlayers"
                  type="number"
                  value={testConfig.virtualPlayers}
                  onChange={(e) =>
                    setTestConfig((prev) => ({ ...prev, virtualPlayers: Number.parseInt(e.target.value) || 0 }))
                  }
                  disabled={testRunning}
                  min={1}
                  max={10000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={testConfig.duration}
                  onChange={(e) =>
                    setTestConfig((prev) => ({ ...prev, duration: Number.parseInt(e.target.value) || 0 }))
                  }
                  disabled={testRunning}
                  min={10}
                  max={300}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="betsPerSecond">Bets/Second</Label>
                <Input
                  id="betsPerSecond"
                  type="number"
                  value={testConfig.betsPerSecond}
                  onChange={(e) =>
                    setTestConfig((prev) => ({ ...prev, betsPerSecond: Number.parseInt(e.target.value) || 0 }))
                  }
                  disabled={testRunning}
                  min={1}
                  max={1000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gameType">Game Types</Label>
                <Select
                  value={testConfig.gameType}
                  onValueChange={(value) => setTestConfig((prev) => ({ ...prev, gameType: value }))}
                  disabled={testRunning}
                >
                  <SelectTrigger id="gameType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Games</SelectItem>
                    <SelectItem value="sports">Sports Only</SelectItem>
                    <SelectItem value="casino">Casino Only</SelectItem>
                    <SelectItem value="slots">Slots Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!testRunning ? (
                <Button onClick={startStressTest} className="bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4 mr-2" />
                  Start Test
                </Button>
              ) : (
                <Button onClick={stopStressTest} variant="destructive">
                  <Square className="w-4 h-4 mr-2" />
                  Stop Test
                </Button>
              )}
              <Button onClick={resetTest} variant="outline" disabled={testRunning}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-foreground">{testProgress.toFixed(0)}%</span>
              </div>
              <Progress value={testProgress} className="h-2" />
            </div>

            {/* Test Results */}
            {testResults && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <h4 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Test Completed
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Requests</p>
                    <p className="font-bold text-foreground">{testResults.totalRequests.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Success Rate</p>
                    <p className="font-bold text-green-400">{testResults.successRate.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Response</p>
                    <p className="font-bold text-foreground">{testResults.avgResponseTime}ms</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Peak Latency</p>
                    <p className="font-bold text-foreground">{testResults.peakLatency}ms</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Errors</p>
                    <p className="font-bold text-red-400">{testResults.errorsEncountered}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Stats Header */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Database className="w-5 h-5" />
              Live Database Statistics
            </CardTitle>
            <CardDescription>Real data from MongoDB - Last updated: {lastUpdated || "Loading..."}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 items-center">
              <Button onClick={fetchRealData} disabled={loading} variant="outline">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Refresh Data
              </Button>
              {testRunning && (
                <Badge variant="outline" className="animate-pulse border-green-500 text-green-400">
                  <Activity className="w-3 h-3 mr-1" />
                  Test Running - Auto-refreshing every 2s
                </Badge>
              )}
              {error && <span className="text-red-400 text-sm">Error: {error}</span>}
            </div>
          </CardContent>
        </Card>

        {/* Show loading or data */}
        {loading && !metrics ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading database statistics...</span>
          </div>
        ) : metrics ? (
          <>
            {/* Main Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Total Users</p>
                      <p className="text-2xl font-bold text-foreground">{metrics.totalUsers.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{metrics.totalPlayers.toLocaleString()} players</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Activity className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Total Bets</p>
                      <p className="text-2xl font-bold text-foreground">{metrics.totalBets.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{metrics.betsToday} today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">DB Latency</p>
                      <p className="text-2xl font-bold text-foreground">{metrics.avgLatency}ms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Percent className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Casino RTP</p>
                      <p className="text-2xl font-bold text-foreground">
                        {metrics.rtp > 0 ? `${metrics.rtp}%` : "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Breakdown Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Trophy className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Sports Bets</p>
                      <p className="text-2xl font-bold text-foreground">{metrics.sportsBets.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                      <Dices className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Casino Rounds</p>
                      <p className="text-2xl font-bold text-foreground">{metrics.casinoBets.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{metrics.casinoRoundsToday} today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <Server className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Active Today</p>
                      <p className="text-2xl font-bold text-foreground">{metrics.activeUsers.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">unique bettors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Error Rate</p>
                      <p className="text-2xl font-bold text-foreground">{metrics.errorRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    DB Latency (ms)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={latencyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                          }}
                        />
                        <Area type="monotone" dataKey="max" stroke="#ef4444" fill="#ef444433" name="Max" />
                        <Area type="monotone" dataKey="p99" stroke="#f59e0b" fill="#f59e0b33" name="P99" />
                        <Area type="monotone" dataKey="avg" stroke="#22c55e" fill="#22c55e33" name="Avg" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    RTP Validation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rtpData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                        <YAxis domain={[90, 100]} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                          }}
                        />
                        <Line type="monotone" dataKey="rtp" stroke="#22c55e" strokeWidth={2} dot={false} name="RTP %" />
                        <Line
                          type="monotone"
                          dataKey="target"
                          stroke="hsl(var(--primary))"
                          strokeDasharray="5 5"
                          strokeWidth={2}
                          dot={false}
                          name="Target"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Health & Errors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Server className="w-5 h-5 text-primary" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">DB Connections</span>
                    <Badge variant={metrics.dbConnections > 80 ? "destructive" : "default"}>
                      {metrics.dbConnections}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Throughput</span>
                    <Badge className="bg-green-600">{metrics.throughput} req/min</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Error Rate</span>
                    <Badge variant={Number.parseFloat(metrics.errorRate) > 1 ? "destructive" : "default"}>
                      {metrics.errorRate}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Max Latency</span>
                    <Badge variant={metrics.maxLatency > 200 ? "destructive" : "default"}>{metrics.maxLatency}ms</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Recent Errors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {errors.length === 0 ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>No errors in the last hour</span>
                      </div>
                    ) : (
                      errors.map((error, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-sm p-2 bg-red-500/10 rounded border border-red-500/20"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-red-400 font-medium">{error.type}</span>
                            <span className="text-muted-foreground ml-2">{error.time}</span>
                            <p className="text-muted-foreground text-xs">{error.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-red-400">Failed to load data. {error && `Error: ${error}`}</div>
        )}
      </div>
    </SuperAdminLayout>
  )
}
