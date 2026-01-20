export const PAYMENT_METHODS = {
  bank: {
    id: "bank",
    name: "Bank Transfer",
    description: "Direct bank deposit",
    icon: "Building2",
    color: "#4A90E2",
    enabled: true,
    requiresProof: true,
  },
  mpesa: {
    id: "mpesa",
    name: "M-Pesa Pay",
    description: "Mobile money transfer",
    icon: "Smartphone",
    color: "#22C55E",
    enabled: true,
    requiresProof: true,
  },
  orange: {
    id: "orange",
    name: "Orange Money",
    description: "Orange mobile money",
    icon: "Smartphone",
    color: "#FF8C00",
    enabled: true,
    requiresProof: true,
  },
  card: {
    id: "card",
    name: "Card Payment",
    description: "Debit/Credit card",
    icon: "CreditCard",
    color: "#3B82F6",
    enabled: true,
    requiresProof: false,
  },
  airtime: {
    id: "airtime",
    name: "Airtime Payment",
    description: "Pay via mobile airtime",
    icon: "Radio",
    color: "#8B5CF6",
    enabled: false,
    requiresProof: true,
  },
  crypto: {
    id: "crypto",
    name: "Cryptocurrency",
    description: "Bitcoin, Ethereum, USDT",
    icon: "Bitcoin",
    color: "#F59E0B",
    enabled: false,
    requiresProof: true,
  },
}

export const DEFAULT_PAYMENT_PROVIDERS = {
  bank: { enabled: true, apiKey: "", secretKey: "" },
  mpesa: { enabled: true, apiKey: "", merchantId: "" },
  orange: { enabled: true, apiKey: "", merchantId: "" },
  card: { enabled: true, apiKey: "", secretKey: "" },
  airtime: { enabled: false, apiKey: "", apiSecret: "" },
  crypto: { enabled: false, apiKey: "", walletAddress: "", supportedCryptos: ["BTC", "ETH", "USDT"] },
}

export const CRYPTO_TYPES = ["Bitcoin (BTC)", "Ethereum (ETH)", "USDT (Tether)", "USDC (Circle)"]
