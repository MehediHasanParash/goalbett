import mongoose from "mongoose"

if (mongoose.models.GameProvider) {
  delete mongoose.models.GameProvider
}

const GameProviderSchema = new mongoose.Schema(
  {
    // Basic Info
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
    },

    // Provider Type
    type: {
      type: String,
      enum: ["Live Casino", "Slots", "3D Slots", "Table Games", "Sports", "Virtual Sports", "Lottery", "Other"],
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance", "pending"],
      default: "pending",
    },

    // Configuration
    config: {
      apiKey: { type: String, default: "" },
      apiSecret: { type: String, default: "" },
      apiUrl: { type: String, default: "" },
      webhookUrl: { type: String, default: "" },
      certificationId: { type: String, default: "" },
      currency: [{ type: String }],
      languages: [{ type: String }],
      customSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    },

    // Games & Revenue
    gamesCount: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },

    // Integration Details
    integration: {
      method: {
        type: String,
        enum: ["iframe", "api", "seamless", "transfer", "custom"],
        default: "iframe",
      },
      testMode: { type: Boolean, default: true },
      lastSync: { type: Date, default: null },
      syncStatus: {
        type: String,
        enum: ["success", "failed", "pending", "never"],
        default: "never",
      },
    },

    // Branding
    branding: {
      logo: { type: String, default: "" },
      thumbnail: { type: String, default: "" },
      primaryColor: { type: String, default: "#FFD700" },
      website: { type: String, default: "" },
    },

    // Licensing & Compliance
    licensing: {
      licenses: [{ type: String }],
      certifications: [{ type: String }],
      regions: [{ type: String }],
      restrictedCountries: [{ type: String }],
    },

    // Performance Metrics
    metrics: {
      totalBets: { type: Number, default: 0 },
      totalWins: { type: Number, default: 0 },
      totalPlayers: { type: Number, default: 0 },
      averageRTP: { type: Number, default: 0 },
      uptime: { type: Number, default: 100 },
    },

    // Tenant Assignment (null = platform-wide)
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
GameProviderSchema.index({ status: 1 })
GameProviderSchema.index({ type: 1, status: 1 })
GameProviderSchema.index({ tenantId: 1 })
GameProviderSchema.index({ slug: 1 })

export default mongoose.model("GameProvider", GameProviderSchema)
