const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/v1"

class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL
    this.token = null
  }

  setToken(token) {
    this.token = token
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired - clear it
          this.token = null
          throw new Error("Unauthorized")
        }
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error.message)
      throw error
    }
  }

  // Auth endpoints
  async login(phone, password) {
    return this.request("/auth", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    })
  }

  async register(phone, password, email) {
    return this.request("/auth", {
      method: "POST",
      body: JSON.stringify({ phone, password, email }),
    })
  }

  async verifyOtp(phone, otp) {
    return this.request("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    })
  }

  async getMe() {
    return this.request("/me")
  }

  // Sports endpoints
  async getSports() {
    return this.request("/sports")
  }

  async getSportEvents(sportId) {
    return this.request(`/sports/${sportId}/events`)
  }

  async getFeaturedBets() {
    return this.request("/sports/featured")
  }

  async getEventDetails(eventId) {
    return this.request(`/events/${eventId}`)
  }

  // Bets endpoints
  async priceCheck(selections) {
    return this.request("/bets/price", {
      method: "POST",
      body: JSON.stringify({ selections }),
    })
  }

  async placeBet(betData) {
    return this.request("/bets/place", {
      method: "POST",
      body: JSON.stringify(betData),
    })
  }

  async getMyBets(filters = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/bets/me?${params}`)
  }

  async getBetDetails(betId) {
    return this.request(`/bets/${betId}`)
  }

  async cashoutOffer(betId) {
    return this.request(`/bets/cashout/offer`, {
      method: "POST",
      body: JSON.stringify({ betId }),
    })
  }

  async acceptCashout(betId, offerPrice) {
    return this.request(`/bets/cashout/accept`, {
      method: "POST",
      body: JSON.stringify({ betId, offerPrice }),
    })
  }

  // Wallet endpoints
  async getWallet() {
    return this.request("/wallet")
  }

  async getTransactions(type = "all", limit = 50) {
    return this.request(`/transactions?type=${type}&limit=${limit}`)
  }

  // Payments endpoints
  async initiatePayment(method, amount) {
    return this.request("/payments/initiate", {
      method: "POST",
      body: JSON.stringify({ method, amount }),
    })
  }

  async telebirrInitiate(amount, returnUrl) {
    return this.request("/payments/telebirr/initiate", {
      method: "POST",
      body: JSON.stringify({ amount, returnUrl }),
    })
  }

  async getPaymentStatus(paymentId) {
    return this.request(`/payments/${paymentId}`)
  }

  // Jackpot endpoints
  async getActiveJackpots() {
    return this.request("/jackpot/rounds/active")
  }

  async placeJackpotTicket(selections, stake) {
    return this.request("/jackpot/ticket", {
      method: "POST",
      body: JSON.stringify({ selections, stake }),
    })
  }

  async getMyJackpotTickets() {
    return this.request("/jackpot/tickets/me")
  }

  // Retail/Agent endpoints
  async bookBet(betData) {
    return this.request("/retail/book", {
      method: "POST",
      body: JSON.stringify(betData),
    })
  }

  async redeemCode(code) {
    return this.request("/retail/redeem", {
      method: "POST",
      body: JSON.stringify({ code }),
    })
  }

  // Agent endpoints
  async getAgentDashboard() {
    return this.request("/agents/dashboard")
  }

  async addSubAgent(agentData) {
    return this.request("/agents/subagents", {
      method: "POST",
      body: JSON.stringify(agentData),
    })
  }

  async getAgentCustomers() {
    return this.request("/agents/customers")
  }

  // KYC endpoints
  async uploadKYCDocument(docType, file) {
    const formData = new FormData()
    formData.append("type", docType)
    formData.append("file", file)

    return fetch(`${this.baseURL}/kyc/documents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    }).then((res) => res.json())
  }

  async getKYCStatus() {
    return this.request("/kyc/status")
  }

  // Admin endpoints
  async getAdminMetrics(range = "today") {
    return this.request(`/admin/metrics?range=${range}`)
  }

  async getTenants() {
    return this.request("/admin/tenants")
  }

  async createTenant(tenantData) {
    return this.request("/admin/tenants", {
      method: "POST",
      body: JSON.stringify(tenantData),
    })
  }

  async updateTenant(tenantId, tenantData) {
    return this.request(`/admin/tenants/${tenantId}`, {
      method: "PATCH",
      body: JSON.stringify(tenantData),
    })
  }

  async getThemeConfig(tenantId) {
    return this.request(`/admin/theme?tenant=${tenantId}`)
  }

  async updateThemeConfig(tenantId, themeData) {
    return this.request("/admin/theme", {
      method: "POST",
      body: JSON.stringify({ tenant: tenantId, ...themeData }),
    })
  }

  async getPayments(filters = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/admin/payments?${params}`)
  }

  async getUSSDSessions() {
    return this.request("/admin/ussd/sessions")
  }

  async getSMSMessages(limit = 100) {
    return this.request(`/admin/sms/messages?limit=${limit}`)
  }

  async getJackpotRounds() {
    return this.request("/admin/jackpot/rounds")
  }

  async createJackpotRound(roundData) {
    return this.request("/admin/jackpot/rounds", {
      method: "POST",
      body: JSON.stringify(roundData),
    })
  }

  async settleJackpotRound(roundId, results) {
    return this.request(`/admin/jackpot/rounds/${roundId}/settle`, {
      method: "POST",
      body: JSON.stringify({ results }),
    })
  }

  async getPromotionsConfig() {
    return this.request("/admin/promotions")
  }

  async updatePromotionsConfig(configData) {
    return this.request("/admin/promotions", {
      method: "POST",
      body: JSON.stringify(configData),
    })
  }

  async getProviders() {
    return this.request("/admin/providers")
  }

  async createProvider(providerData) {
    return this.request("/admin/providers", {
      method: "POST",
      body: JSON.stringify(providerData),
    })
  }

  async getAuditLogs(filters = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/admin/audit?${params}`)
  }

  async exportData(type, period) {
    return this.request(`/admin/exports?type=${type}&period=${period}`)
  }
}

export const apiClient = new ApiClient()
