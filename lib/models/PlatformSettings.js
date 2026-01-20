import mongoose from "mongoose"

const PlatformSettingsSchema = new mongoose.Schema(
  {
    // Singleton - only one document
    _id: {
      type: String,
      default: "platform_settings",
    },

    // Geo Blocking Settings
    geoBlocking: {
      enabled: {
        type: Boolean,
        default: false,
      },
      mode: {
        type: String,
        enum: ["whitelist", "blacklist"],
        default: "blacklist", // blacklist = block specific countries, whitelist = only allow specific countries
      },
      defaultAction: {
        type: String,
        enum: ["ALLOW", "BLOCK"],
        default: "ALLOW",
      },
      blockMessage: {
        type: String,
        default: "This service is not available in your country.",
      },
      enabledAt: Date,
      disabledAt: Date,
      lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },

    // IP Allowlist for Super Admin (separate from geo blocking)
    superAdminIpAllowlist: {
      enabled: {
        type: Boolean,
        default: false,
      },
      ips: [String],
    },

    // Platform Maintenance Mode
    maintenance: {
      enabled: {
        type: Boolean,
        default: false,
      },
      message: {
        type: String,
        default: "Platform is under maintenance. Please try again later.",
      },
      allowedIps: [String],
      startedAt: Date,
      estimatedEnd: Date,
    },

    // Rate Limiting
    rateLimiting: {
      enabled: {
        type: Boolean,
        default: true,
      },
      requestsPerMinute: {
        type: Number,
        default: 100,
      },
      burstLimit: {
        type: Number,
        default: 200,
      },
    },

    // Shadow User / Stress Test Settings
    stressTest: {
      enabled: {
        type: Boolean,
        default: false,
      },
      maxVirtualUsers: {
        type: Number,
        default: 10000,
      },
    },
  },
  {
    timestamps: true,
  },
)

// Static method to get settings (creates default if not exists)
PlatformSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findById("platform_settings")
  if (!settings) {
    settings = await this.create({ _id: "platform_settings" })
  }
  return settings
}

// Static method to update settings
PlatformSettingsSchema.statics.updateSettings = async function (updates, userId) {
  const settings = await this.findByIdAndUpdate(
    "platform_settings",
    {
      ...updates,
      ...(updates.geoBlocking && { "geoBlocking.lastModifiedBy": userId }),
    },
    { new: true, upsert: true },
  )
  return settings
}

export default mongoose.models.PlatformSettings || mongoose.model("PlatformSettings", PlatformSettingsSchema)
