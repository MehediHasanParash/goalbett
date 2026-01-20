"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Mail, Lock, User, Phone } from "lucide-react"
import { AuthLayout } from "@/components/ui/auth-layout"
import { InputField } from "@/components/ui/input-field"
import { BrandedButton } from "@/components/ui/branded-button"
import { ResponsibleGamingNudge } from "@/components/compliance/responsible-gaming-nudge"
import { useTenant } from "@/components/providers/tenant-provider"
import { useRouter } from "next/navigation"
import { setAuthToken, setUser as setStoredUser } from "@/lib/auth-service"

function AuthPageContent() {
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState("login")
  const [isLoading, setIsLoading] = useState(false)
  const { brandName, primaryColor, tenantId } = useTenant()
  const router = useRouter()

  useEffect(() => {
    if (tabFromUrl && ["login", "register", "join"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  // Login state
  const [loginData, setLoginData] = useState({
    identifier: "",
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

  // Join state (player joining via agent/tenant)
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

  const displayName = brandName || "GoalBet"

  const handleLoginChange = (field) => (e) => {
    setLoginData({ ...loginData, [field]: e.target.value })
    if (errors[`login_${field}`]) {
      setErrors({ ...errors, [`login_${field}`]: "" })
    }
  }

  const handleSignupChange = (field) => (e) => {
    setSignupData({ ...signupData, [field]: e.target.value })
    if (errors[`signup_${field}`]) {
      setErrors({ ...errors, [`signup_${field}`]: "" })
    }
  }

  const handleJoinChange = (field) => (e) => {
    setJoinData({ ...joinData, [field]: e.target.value })
    if (errors[`join_${field}`]) {
      setErrors({ ...errors, [`join_${field}`]: "" })
    }
  }

  const handleLogin = async () => {
    setIsLoading(true)
    setErrors({})

    try {
      const identifier = loginData.identifier.trim()
      const loginPayload = {
        password: loginData.password,
        role: "player",
        hostname: typeof window !== "undefined" ? window.location.hostname : "",
      }

      if (identifier.includes("@")) {
        loginPayload.email = identifier
      } else if (/^[+]?[0-9]+$/.test(identifier)) {
        loginPayload.phone = identifier
      } else {
        loginPayload.username = identifier
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginPayload),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ login_identifier: data.error || "Invalid credentials" })
        setIsLoading(false)
        return
      }

      if (data.token) {
        setAuthToken(data.token)
      }
      if (data.user) {
        setStoredUser(data.user)
      }

      router.push("/p/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      setErrors({ login_identifier: "Connection error. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async () => {
    setIsLoading(true)
    setErrors({})

    if (signupData.password !== signupData.confirmPassword) {
      setErrors({ signup_confirmPassword: "Passwords do not match" })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: signupData.fullName,
          email: signupData.email,
          phone: signupData.phone,
          password: signupData.password,
          role: "player",
          tenantId: tenantId,
          hostname: typeof window !== "undefined" ? window.location.hostname : "",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ signup_email: data.error || "Registration failed" })
        setIsLoading(false)
        return
      }

      if (data.token) {
        setAuthToken(data.token)
      }
      if (data.user) {
        setStoredUser(data.user)
      }

      router.push("/p/dashboard")
    } catch (error) {
      console.error("Signup error:", error)
      setErrors({ signup_email: "Connection error. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoin = async () => {
    setIsLoading(true)
    setErrors({})

    if (joinData.password !== joinData.confirmPassword) {
      setErrors({ join_confirmPassword: "Passwords do not match" })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: joinData.fullName,
          email: joinData.email,
          phone: joinData.phone,
          password: joinData.password,
          role: "player",
          referralCode: joinData.referralCode,
          brandCode: joinData.brandCode,
          tenantId: tenantId,
          hostname: typeof window !== "undefined" ? window.location.hostname : "",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ join_email: data.error || "Join failed" })
        setIsLoading(false)
        return
      }

      if (data.token) {
        setAuthToken(data.token)
      }
      if (data.user) {
        setStoredUser(data.user)
      }

      router.push("/p/dashboard")
    } catch (error) {
      console.error("Join error:", error)
      setErrors({ join_email: "Connection error. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title={`Welcome to ${displayName}`} subtitle="Login, Sign Up, or Join">
      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        {["login", "register", "join"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-secondary text-secondary-foreground"
                : "bg-[#1A2F45] text-[#B8C5D6] hover:bg-[#2A3F55]"
            }`}
          >
            {tab === "login" ? "Login" : tab === "register" ? "Register" : "Join Brand"}
          </button>
        ))}
      </div>

      {/* Login Tab */}
      {activeTab === "login" && (
        <div className="space-y-4">
          <InputField
            type="text"
            placeholder="Email, Phone, or Username"
            icon={User}
            value={loginData.identifier}
            onChange={handleLoginChange("identifier")}
            error={errors.login_identifier}
          />
          <InputField
            type="password"
            placeholder="Password"
            icon={Lock}
            value={loginData.password}
            onChange={handleLoginChange("password")}
            error={errors.login_password}
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2 accent-secondary" />
              <span className="text-[#B8C5D6]">Remember me</span>
            </label>
            <a href="#" className="text-secondary hover:underline">
              Forgot password?
            </a>
          </div>

          <BrandedButton
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleLogin}
            disabled={isLoading}
            showLogo={false}
          >
            {isLoading ? "Logging in..." : "Login"}
          </BrandedButton>

          {/* Link to other role login */}
          <div className="text-center pt-2">
            <a href="/admin/login" className="text-sm text-[#B8C5D6] hover:text-secondary transition-colors">
              Login as Agent/Admin
            </a>
          </div>

          <ResponsibleGamingNudge type="login" />
        </div>
      )}

      {/* Register Tab */}
      {activeTab === "register" && (
        <div className="space-y-4">
          <InputField
            type="text"
            placeholder="Full Name"
            icon={User}
            value={signupData.fullName}
            onChange={handleSignupChange("fullName")}
            error={errors.signup_fullName}
          />
          <InputField
            type="email"
            placeholder="Email Address"
            icon={Mail}
            value={signupData.email}
            onChange={handleSignupChange("email")}
            error={errors.signup_email}
          />
          <InputField
            type="tel"
            placeholder="Phone Number"
            icon={Phone}
            value={signupData.phone}
            onChange={handleSignupChange("phone")}
            error={errors.signup_phone}
          />
          <InputField
            type="password"
            placeholder="Password"
            icon={Lock}
            value={signupData.password}
            onChange={handleSignupChange("password")}
            error={errors.signup_password}
          />
          <InputField
            type="password"
            placeholder="Confirm Password"
            icon={Lock}
            value={signupData.confirmPassword}
            onChange={handleSignupChange("confirmPassword")}
            error={errors.signup_confirmPassword}
          />

          <label className="flex items-start text-sm text-[#B8C5D6]">
            <input type="checkbox" className="mr-2 mt-1 accent-secondary" />
            <span>
              I agree to the{" "}
              <a href="/terms" className="text-secondary hover:underline">
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-secondary hover:underline">
                Privacy Policy
              </a>
            </span>
          </label>

          <BrandedButton
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSignup}
            disabled={isLoading}
            showLogo={false}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </BrandedButton>

          <ResponsibleGamingNudge type="signup" />
        </div>
      )}

      {/* Join Tab */}
      {activeTab === "join" && (
        <div className="space-y-4">
          <div className="bg-[#1A2F45] p-4 rounded-lg mb-4">
            <p className="text-sm text-[#B8C5D6]">
              Join an existing brand using a referral code or brand code provided by an agent.
            </p>
          </div>

          <InputField
            type="text"
            placeholder="Referral Code (optional)"
            value={joinData.referralCode}
            onChange={handleJoinChange("referralCode")}
            error={errors.join_referralCode}
          />
          <InputField
            type="text"
            placeholder="Brand Code (optional)"
            value={joinData.brandCode}
            onChange={handleJoinChange("brandCode")}
            error={errors.join_brandCode}
          />

          <div className="border-t border-[#2A3F55] my-4" />

          <InputField
            type="text"
            placeholder="Full Name"
            icon={User}
            value={joinData.fullName}
            onChange={handleJoinChange("fullName")}
            error={errors.join_fullName}
          />
          <InputField
            type="email"
            placeholder="Email Address"
            icon={Mail}
            value={joinData.email}
            onChange={handleJoinChange("email")}
            error={errors.join_email}
          />
          <InputField
            type="tel"
            placeholder="Phone Number"
            icon={Phone}
            value={joinData.phone}
            onChange={handleJoinChange("phone")}
            error={errors.join_phone}
          />
          <InputField
            type="password"
            placeholder="Password"
            icon={Lock}
            value={joinData.password}
            onChange={handleJoinChange("password")}
            error={errors.join_password}
          />
          <InputField
            type="password"
            placeholder="Confirm Password"
            icon={Lock}
            value={joinData.confirmPassword}
            onChange={handleJoinChange("confirmPassword")}
            error={errors.join_confirmPassword}
          />

          <BrandedButton
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleJoin}
            disabled={isLoading}
            showLogo={false}
          >
            {isLoading ? "Joining..." : "Join Brand"}
          </BrandedButton>
        </div>
      )}
    </AuthLayout>
  )
}

export default function PlayerAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A1A2F] flex items-center justify-center">
          <div className="animate-pulse text-[#B8C5D6]">Loading...</div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  )
}
