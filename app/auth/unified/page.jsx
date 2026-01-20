"use client"
import { useState } from "react"
import { Mail, Lock, User, Phone } from "lucide-react"
import { AuthLayout } from "@/components/ui/auth-layout"
import { InputField } from "@/components/ui/input-field"
import { AnimatedButton } from "@/components/ui/animated-button"
import { DemoCredentialsHelper } from "@/components/auth/demo-credentials-helper"
import { ResponsibleGamingNudge } from "@/components/compliance/responsible-gaming-nudge"
import { ROLES, createToken } from "@/lib/auth-service"
import { useRouter } from "next/navigation"

export default function UnifiedAuthPage() {
  const [activeTab, setActiveTab] = useState("login")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const router = useRouter()

  // Login state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  // Signup state
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })

  // Join state
  const [joinData, setJoinData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
    brandCode: "",
  })

  const [errors, setErrors] = useState({})

  // Handle login input
  const handleLoginChange = (field) => (e) => {
    setLoginData({ ...loginData, [field]: e.target.value })
    if (errors[`login_${field}`]) {
      setErrors({ ...errors, [`login_${field}`]: "" })
    }
  }

  // Handle signup input
  const handleSignupChange = (field) => (e) => {
    setSignupData({ ...signupData, [field]: e.target.value })
    if (errors[`signup_${field}`]) {
      setErrors({ ...errors, [`signup_${field}`]: "" })
    }
  }

  // Handle join input
  const handleJoinChange = (field) => (e) => {
    setJoinData({ ...joinData, [field]: e.target.value })
    if (errors[`join_${field}`]) {
      setErrors({ ...errors, [`join_${field}`]: "" })
    }
  }

  // Login handler
  const handleLogin = async () => {
    setIsLoading(true)

    const demoUsers = {
      "player@demo.com": {
        id: "player_1",
        role: ROLES.PLAYER,
        fullName: "John Player",
        balance: 2500,
        avatar: "/placeholder-user.jpg",
      },
      "agent@demo.com": {
        id: "agent_1",
        role: ROLES.AGENT,
        fullName: "Agent Smith",
        balance: 15000,
        avatar: "/placeholder-user.jpg",
      },
      "tenant@demo.com": {
        id: "tenant_1",
        role: ROLES.TENANT_ADMIN,
        fullName: "Tenant Admin",
        balance: 50000,
        avatar: "/placeholder-user.jpg",
      },
      "superadmin@demo.com": {
        id: "superadmin_1",
        role: ROLES.SUPERADMIN,
        fullName: "Super Admin",
        balance: 100000,
        avatar: "/placeholder-user.jpg",
      },
    }

    const user = demoUsers[loginData.email]
    if (user && loginData.password === "demo123") {
      const userData = {
        ...user,
        email: loginData.email,
        createdAt: new Date().toISOString(),
      }

      createToken(userData)
      localStorage.setItem("user", JSON.stringify(userData))

      switch (user.role) {
        case ROLES.PLAYER:
          router.push("/p/dashboard")
          break
        case ROLES.AGENT:
          router.push("/a/dashboard")
          break
        case ROLES.TENANT_ADMIN:
          router.push("/t/dashboard")
          break
        case ROLES.SUPERADMIN:
          router.push("/s/dashboard")
          break
        default:
          router.push("/")
      }
    } else {
      setErrors({
        login_email: "Invalid credentials. Use demo credentials below.",
      })
    }

    setIsLoading(false)
  }

  const handleSignUp = async () => {
    setIsLoading(true)

    const userData = {
      id: `player_${Date.now()}`,
      fullName: signupData.fullName,
      email: signupData.email,
      phone: signupData.phone,
      avatar: "/placeholder-user.jpg",
      balance: 1000,
      role: ROLES.PLAYER,
      createdAt: new Date().toISOString(),
      tenant: null,
      agent: null,
    }

    localStorage.setItem("user", JSON.stringify(userData))
    createToken(userData)

    setIsLoading(false)
    // Redirect to verification then player dashboard
    window.location.href = "/auth/verify"
  }

  const handleJoin = async () => {
    setIsLoading(true)

    let tenant = null
    let agent = null

    // If referral code provided, link to agent and their tenant
    if (joinData.referralCode) {
      // Demo: Simulate agent/tenant lookup
      agent = {
        id: `agent_${joinData.referralCode}`,
        name: "Agent from Referral",
      }
      tenant = {
        id: `tenant_demo`,
        name: "Brand Name",
      }
    } else if (joinData.brandCode) {
      // If only brand code, player joins brand without specific agent
      tenant = {
        id: `tenant_${joinData.brandCode}`,
        name: "Brand Name",
      }
    }

    const userData = {
      id: `player_${Date.now()}`,
      fullName: joinData.fullName,
      email: joinData.email,
      phone: joinData.phone,
      avatar: "/placeholder-user.jpg",
      balance: 1000,
      role: ROLES.PLAYER,
      createdAt: new Date().toISOString(),
      tenant: tenant,
      agent: agent,
      referralCode: joinData.referralCode || null,
      brandCode: joinData.brandCode || null,
    }

    localStorage.setItem("user", JSON.stringify(userData))
    createToken(userData)

    setIsLoading(false)
    window.location.href = "/auth/verify"
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0A1A2F] to-black/50 text-white relative overflow-hidden">
      <AuthLayout
        title="Goal Betting"
        subtitle="Login, Sign Up, or Join a Brand"
        showBack={true}
        onBack={() => (window.location.href = "/")}
      >
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-white/10">
            {["login", "register", "join"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  setErrors({})
                }}
                className={`flex-1 py-3 font-medium text-center transition-all relative ${
                  activeTab === tab
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "login" ? "Login" : tab === "register" ? "Register" : "Join Brand"}
              </button>
            ))}
          </div>

          {/* Login Tab */}
          {activeTab === "login" && (
            <div className="space-y-6">
              <DemoCredentialsHelper />

              <InputField
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={loginData.email}
                onChange={handleLoginChange("email")}
                error={errors.login_email}
                icon={Mail}
              />

              <InputField
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={handleLoginChange("password")}
                error={errors.login_password}
                icon={Lock}
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-border" />
                  <span className="text-sm text-muted-foreground">Remember me</span>
                </label>
                <button
                  onClick={() => (window.location.href = "/auth/forgot-password")}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <AnimatedButton variant="primary" size="lg" className="w-full" onClick={handleLogin} disabled={isLoading}>
                {isLoading ? "Logging in..." : "Log In"}
              </AnimatedButton>

              <ResponsibleGamingNudge type="login" />
            </div>
          )}

          {/* Register Tab */}
          {activeTab === "register" && (
            <div className="space-y-6">
              <InputField
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
                value={signupData.fullName}
                onChange={handleSignupChange("fullName")}
                error={errors.signup_fullName}
                icon={User}
              />

              <InputField
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={signupData.email}
                onChange={handleSignupChange("email")}
                error={errors.signup_email}
                icon={Mail}
              />

              <InputField
                label="Phone"
                type="tel"
                placeholder="Enter your phone number"
                value={signupData.phone}
                onChange={handleSignupChange("phone")}
                error={errors.signup_phone}
                icon={Phone}
              />

              <InputField
                label="Password"
                type="password"
                placeholder="Create password"
                value={signupData.password}
                onChange={handleSignupChange("password")}
                error={errors.signup_password}
                icon={Lock}
              />

              <InputField
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                value={signupData.confirmPassword}
                onChange={handleSignupChange("confirmPassword")}
                error={errors.signup_confirmPassword}
                icon={Lock}
              />

              <div className="flex items-start space-x-2">
                <input type="checkbox" className="mt-1 rounded border-border" />
                <span className="text-sm text-muted-foreground">
                  I agree to the{" "}
                  <button className="text-primary hover:text-primary/80 transition-colors">Terms of Service</button> and{" "}
                  <button className="text-primary hover:text-primary/80 transition-colors">Privacy Policy</button>
                </span>
              </div>

              <AnimatedButton
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleSignUp}
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Sign Up"}
              </AnimatedButton>

              <ResponsibleGamingNudge type="signup" />
            </div>
          )}

          {/* Join Tab */}
          {activeTab === "join" && (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  Join a specific brand or agent by entering their code. Your account will be linked to their platform.
                </p>
              </div>

              <InputField
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
                value={joinData.fullName}
                onChange={handleJoinChange("fullName")}
                error={errors.join_fullName}
                icon={User}
              />

              <InputField
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={joinData.email}
                onChange={handleJoinChange("email")}
                error={errors.join_email}
                icon={Mail}
              />

              <InputField
                label="Phone"
                type="tel"
                placeholder="Enter your phone number"
                value={joinData.phone}
                onChange={handleJoinChange("phone")}
                error={errors.join_phone}
                icon={Phone}
              />

              <InputField
                label="Password"
                type="password"
                placeholder="Create password"
                value={joinData.password}
                onChange={handleJoinChange("password")}
                error={errors.join_password}
                icon={Lock}
              />

              <InputField
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                value={joinData.confirmPassword}
                onChange={handleJoinChange("confirmPassword")}
                error={errors.join_confirmPassword}
                icon={Lock}
              />

              <div className="space-y-3">
                <label className="block text-sm font-medium">How are you joining?</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Enter Agent Referral Code"
                    value={joinData.referralCode}
                    onChange={handleJoinChange("referralCode")}
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary"
                  />
                  <span className="text-muted-foreground text-sm">OR</span>
                  <input
                    type="text"
                    placeholder="Enter Brand Code"
                    value={joinData.brandCode}
                    onChange={handleJoinChange("brandCode")}
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-primary"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  If you have an agent referral code, use that. Otherwise, enter the brand code to join directly.
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <input type="checkbox" className="mt-1 rounded border-border" />
                <span className="text-sm text-muted-foreground">
                  I agree to the{" "}
                  <button className="text-primary hover:text-primary/80 transition-colors">Terms of Service</button> and{" "}
                  <button className="text-primary hover:text-primary/80 transition-colors">Privacy Policy</button>
                </span>
              </div>

              <AnimatedButton variant="primary" size="lg" className="w-full" onClick={handleJoin} disabled={isLoading}>
                {isLoading ? "Joining..." : "Join Brand"}
              </AnimatedButton>

              <ResponsibleGamingNudge type="signup" />
            </div>
          )}
        </div>
      </AuthLayout>
    </div>
  )
}
