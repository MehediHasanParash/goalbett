import mongoose from "mongoose"

const TenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tenant name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Tenant slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"],
      index: true,
    },
    subdomain: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
      index: true,
      comment: "Auto-generated subdomain (e.g., xbet.goalbett.com)",
    },
    primaryDomain: {
      type: String,
      required: false,
      lowercase: true,
      trim: true,
      index: true,
      comment: "Custom primary domain owned by tenant (e.g., xbet.com)",
    },
    status: {
      type: String,
      enum: ["active", "suspended", "inactive", "trial"],
      default: "trial",
      index: true,
    },
    type: {
      type: String,
      enum: ["provider", "client"],
      default: "client",
      index: true,
    },
    designId: {
      type: String,
      enum: ["classic", "modern", "neon"],
      default: "classic",
      index: true,
      comment: "Selected front-end design template for white-label customization",
    },
    subscription: {
      plan: {
        type: String,
        enum: ["trial", "basic", "pro", "enterprise"],
        default: "trial",
      },
      startDate: { type: Date, default: Date.now },
      endDate: { type: Date },
      isActive: { type: Boolean, default: true },
    },
    revenueShare: {
      providerPercentage: {
        type: Number,
        default: 10,
        min: 0,
        max: 100,
      },
      tenantPercentage: {
        type: Number,
        default: 90,
        min: 0,
        max: 100,
      },
      isEnabled: { type: Boolean, default: true },
    },

    default_currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    supported_currencies: [
      {
        code: { type: String, required: true, uppercase: true },
        name: { type: String },
        symbol: { type: String },
        exchange_rate: { type: Number, default: 1 },
        is_active: { type: Boolean, default: true },
        decimal_places: { type: Number, default: 2 },
      },
    ],

    tax_rules: {
      betting_tax: {
        enabled: { type: Boolean, default: false },
        percentage: { type: Number, default: 0, min: 0, max: 100 },
        applies_to: { type: String, enum: ["stake", "winnings", "profit"], default: "winnings" },
        threshold: { type: Number, default: 0 },
      },
      withholding_tax: {
        enabled: { type: Boolean, default: false },
        percentage: { type: Number, default: 0, min: 0, max: 100 },
        threshold: { type: Number, default: 0 },
      },
      vat: {
        enabled: { type: Boolean, default: false },
        percentage: { type: Number, default: 0, min: 0, max: 100 },
      },
      excise_duty: {
        enabled: { type: Boolean, default: false },
        percentage: { type: Number, default: 0, min: 0, max: 100 },
      },
    },

    payment_methods: {
      mobile_money: {
        mpesa: {
          enabled: { type: Boolean, default: false },
          consumer_key: { type: String, default: "" },
          consumer_secret: { type: String, default: "" },
          shortcode: { type: String, default: "" },
          passkey: { type: String, default: "" },
          environment: { type: String, enum: ["sandbox", "production"], default: "sandbox" },
          min_deposit: { type: Number, default: 10 },
          max_deposit: { type: Number, default: 150000 },
          min_withdraw: { type: Number, default: 50 },
          max_withdraw: { type: Number, default: 150000 },
        },
        airtel: {
          enabled: { type: Boolean, default: false },
          client_id: { type: String, default: "" },
          client_secret: { type: String, default: "" },
          environment: { type: String, enum: ["sandbox", "production"], default: "sandbox" },
          min_deposit: { type: Number, default: 10 },
          max_deposit: { type: Number, default: 150000 },
        },
        orange: {
          enabled: { type: Boolean, default: false },
          merchant_key: { type: String, default: "" },
          api_user: { type: String, default: "" },
          api_key: { type: String, default: "" },
        },
        telebirr: {
          enabled: { type: Boolean, default: false },
          app_id: { type: String, default: "" },
          app_key: { type: String, default: "" },
          short_code: { type: String, default: "" },
          public_key: { type: String, default: "" },
        },
      },
      bank_transfer: {
        enabled: { type: Boolean, default: false },
        bank_name: { type: String, default: "" },
        account_name: { type: String, default: "" },
        account_number: { type: String, default: "" },
        swift_code: { type: String, default: "" },
        min_deposit: { type: Number, default: 100 },
        max_deposit: { type: Number, default: 1000000 },
        processing_time: { type: String, default: "1-3 business days" },
      },
      card: {
        stripe: {
          enabled: { type: Boolean, default: false },
          publishable_key: { type: String, default: "" },
          secret_key: { type: String, default: "" },
          webhook_secret: { type: String, default: "" },
        },
        paystack: {
          enabled: { type: Boolean, default: false },
          public_key: { type: String, default: "" },
          secret_key: { type: String, default: "" },
        },
        flutterwave: {
          enabled: { type: Boolean, default: false },
          public_key: { type: String, default: "" },
          secret_key: { type: String, default: "" },
          encryption_key: { type: String, default: "" },
        },
      },
      crypto: {
        enabled: { type: Boolean, default: false },
        accepted_coins: [{ type: String }],
        wallet_addresses: {
          btc: { type: String, default: "" },
          eth: { type: String, default: "" },
          usdt: { type: String, default: "" },
        },
        provider: { type: String, enum: ["manual", "coinbase", "binance", "nowpayments"], default: "manual" },
        api_key: { type: String, default: "" },
      },
      ussd: {
        enabled: { type: Boolean, default: false },
        short_code: { type: String, default: "" },
        service_code: { type: String, default: "" },
        provider: { type: String, default: "" },
      },
    },

    betting_limits: {
      min_stake: { type: Number, default: 1 },
      max_stake: { type: Number, default: 100000 },
      max_potential_win: { type: Number, default: 1000000 },
      max_selections_per_slip: { type: Number, default: 30 },
      max_bets_per_day: { type: Number, default: 1000 },
      max_daily_deposit: { type: Number, default: 500000 },
      max_daily_withdrawal: { type: Number, default: 500000 },
      min_odds: { type: Number, default: 1.01 },
      max_odds: { type: Number, default: 1000 },
      max_accumulator_odds: { type: Number, default: 50000 },
      cashout_enabled: { type: Boolean, default: true },
      partial_cashout_enabled: { type: Boolean, default: true },
      live_betting_enabled: { type: Boolean, default: true },
      live_cashout_enabled: { type: Boolean, default: true },
    },

    odds_margin: {
      default_margin: { type: Number, default: 5, min: 0, max: 50 },
      sports_margins: {
        football: { type: Number, default: 5 },
        basketball: { type: Number, default: 6 },
        tennis: { type: Number, default: 5 },
        cricket: { type: Number, default: 6 },
        rugby: { type: Number, default: 6 },
        american_football: { type: Number, default: 5 },
        baseball: { type: Number, default: 6 },
        hockey: { type: Number, default: 6 },
        mma: { type: Number, default: 7 },
        boxing: { type: Number, default: 7 },
        esports: { type: Number, default: 8 },
        virtual: { type: Number, default: 10 },
      },
      market_margins: {
        match_winner: { type: Number, default: 5 },
        over_under: { type: Number, default: 6 },
        handicap: { type: Number, default: 6 },
        both_teams_score: { type: Number, default: 5 },
        correct_score: { type: Number, default: 15 },
        first_goalscorer: { type: Number, default: 20 },
      },
      live_margin_increase: { type: Number, default: 2 },
    },

    casino_providers: {
      enabled: { type: Boolean, default: false },
      providers: [
        {
          name: { type: String, required: true },
          slug: { type: String, required: true },
          api_url: { type: String },
          api_key: { type: String },
          api_secret: { type: String },
          operator_id: { type: String },
          is_active: { type: Boolean, default: true },
          game_types: [{ type: String }],
          revenue_share: { type: Number, default: 0 },
          min_bet: { type: Number, default: 1 },
          max_bet: { type: Number, default: 10000 },
        },
      ],
      default_rtp: { type: Number, default: 96 },
      house_edge: { type: Number, default: 4 },
    },

    sports_feed: {
      primary_provider: {
        name: { type: String, default: "manual" },
        api_url: { type: String, default: "" },
        api_key: { type: String, default: "" },
        api_secret: { type: String, default: "" },
        is_active: { type: Boolean, default: false },
      },
      backup_provider: {
        name: { type: String, default: "" },
        api_url: { type: String, default: "" },
        api_key: { type: String, default: "" },
        is_active: { type: Boolean, default: false },
      },
      live_scores: {
        enabled: { type: Boolean, default: true },
        provider: { type: String, default: "" },
        api_key: { type: String, default: "" },
        update_interval: { type: Number, default: 30 },
      },
      odds_feed: {
        enabled: { type: Boolean, default: false },
        provider: { type: String, default: "" },
        api_key: { type: String, default: "" },
        auto_suspend_delay: { type: Number, default: 5 },
      },
      enabled_sports: [{ type: String }],
    },

    risk_management: {
      max_liability_per_event: { type: Number, default: 100000 },
      max_liability_per_market: { type: Number, default: 50000 },
      max_liability_per_selection: { type: Number, default: 25000 },
      max_win_per_bet: { type: Number, default: 500000 },
      max_win_per_day_per_user: { type: Number, default: 1000000 },
      auto_accept_below: { type: Number, default: 1000 },
      manual_review_above: { type: Number, default: 10000 },
      suspicious_activity: {
        max_bets_per_minute: { type: Number, default: 10 },
        max_stake_change_percent: { type: Number, default: 500 },
        arbitrage_detection: { type: Boolean, default: true },
        related_accounts_detection: { type: Boolean, default: true },
      },
      liability_alerts: {
        warning_threshold: { type: Number, default: 70 },
        critical_threshold: { type: Number, default: 90 },
        email_notifications: { type: Boolean, default: true },
        sms_notifications: { type: Boolean, default: false },
      },
      void_rules: {
        walkover_action: { type: String, enum: ["void", "half_lose", "full_lose"], default: "void" },
        postponed_action: { type: String, enum: ["void", "keep_open"], default: "void" },
        abandoned_action: { type: String, enum: ["void", "settled_at_time"], default: "void" },
      },
      player_limits: {
        new_player_max_stake: { type: Number, default: 1000 },
        new_player_period_days: { type: Number, default: 7 },
        vip_multiplier: { type: Number, default: 10 },
      },
    },

    theme: {
      primaryColor: { type: String, default: "#FFD700" },
      secondaryColor: { type: String, default: "#0A1A2F" },
      accentColor: { type: String, default: "#4A90E2" },
      logoUrl: { type: String, default: "" },
      faviconUrl: { type: String, default: "" },
      brandName: { type: String, default: "" },
      customCSS: { type: String, default: "" },
      jackpotTicker: {
        enabled: { type: Boolean, default: true },
        megaJackpot: {
          label: { type: String, default: "MEGA JACKPOT" },
          amount: { type: Number, default: 2847392 },
          isActive: { type: Boolean, default: true },
        },
        dailyJackpot: {
          label: { type: String, default: "DAILY JACKPOT" },
          amount: { type: Number, default: 47293 },
          isActive: { type: Boolean, default: true },
        },
        hourlyJackpot: {
          label: { type: String, default: "HOURLY JACKPOT" },
          amount: { type: Number, default: 3847 },
          isActive: { type: Boolean, default: true },
        },
        autoIncrement: {
          enabled: { type: Boolean, default: true },
          megaRate: { type: Number, default: 50 }, // Amount to add per interval
          dailyRate: { type: Number, default: 10 },
          hourlyRate: { type: Number, default: 5 },
          intervalSeconds: { type: Number, default: 3 },
        },
      },
    },
    domain_list: [
      {
        domain: { type: String, required: true },
        isPrimary: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        type: { type: String, enum: ["subdomain", "primary", "custom"], default: "subdomain" },
      },
    ],
    adminUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
    },
    metadata: {
      businessName: { type: String, default: "" },
      contactEmail: { type: String, default: "" },
      contactPhone: { type: String, default: "" },
      address: { type: String, default: "" },
      timezone: { type: String, default: "UTC" },
      industry: { type: String, default: "" },
      license_number: { type: String, default: "" },
      license_expiry: { type: Date },
      country: { type: String, default: "" },
      regulatory_body: { type: String, default: "" },
    },
    domainVerification: {
      isVerified: { type: Boolean, default: false },
      verificationToken: { type: String, default: "" },
      verifiedAt: { type: Date, default: null },
      dnsRecords: {
        type: [
          {
            type: { type: String, enum: ["A", "CNAME", "TXT"] },
            name: String,
            value: String,
            status: { type: String, enum: ["pending", "verified", "failed"], default: "pending" },
          },
        ],
        default: [],
      },
    },
    stats: {
      totalUsers: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      totalProviderRevenue: { type: Number, default: 0 },
    },

    features: {
      sports_betting: { type: Boolean, default: true },
      live_betting: { type: Boolean, default: true },
      casino: { type: Boolean, default: false },
      virtual_sports: { type: Boolean, default: false },
      jackpot: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      affiliate_program: { type: Boolean, default: false },
      loyalty_program: { type: Boolean, default: false },
      responsible_gambling: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  },
)

TenantSchema.index({ subdomain: 1 })
TenantSchema.index({ primaryDomain: 1 })
TenantSchema.index({ "domain_list.domain": 1 })
TenantSchema.index({ providerId: 1, status: 1 })
TenantSchema.index({ designId: 1 })

export default mongoose.models.Tenant || mongoose.model("Tenant", TenantSchema)
