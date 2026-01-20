export const DEFAULT_TENANT_CONFIG = {
  name: "GoalBet",
  currency: "USD",
  language: "am",
  modules: {
    sports: true,
    casino: true,
    virtual: true,
    jackpot: true,
    retail: false,
  },
  colors: {
    primary: "#0A1A2F",
    secondary: "#FFD700",
    accent: "#4A90E2",
    background: "#0D1F35",
  },
  limits: {
    maxDailyWithdrawal: 100,
    maxDailyDeposit: 10000,
  },
}

export class TenantConfigManager {
  static instance = null
  static config = DEFAULT_TENANT_CONFIG

  static getInstance() {
    if (!this.instance) {
      this.instance = new TenantConfigManager()
    }
    return this.instance
  }

  static getConfig() {
    return this.config
  }

  static setConfig(config) {
    this.config = { ...this.config, ...config }
  }

  static getModule(moduleName) {
    return this.config.modules[moduleName] || false
  }

  static isModuleEnabled(moduleName) {
    return this.getModule(moduleName) === true
  }

  static getCurrency() {
    return this.config.currency
  }

  static getLanguage() {
    return this.config.language
  }

  static getColors() {
    return this.config.colors
  }
}
