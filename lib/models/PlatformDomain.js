import mongoose from "mongoose"

const platformDomainSchema = new mongoose.Schema(
  {
    domain: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    type: {
      type: String,
      enum: ["primary", "backup", "mirror"],
      default: "backup",
    },
    status: {
      type: String,
      enum: ["healthy", "degraded", "blocked", "checking", "offline", "pending_dns", "verified"],
      default: "checking",
    },
    priority: {
      type: Number,
      default: 0,
    },
    lastHealthCheck: {
      type: Date,
      default: null,
    },
    responseTime: {
      type: Number,
      default: null,
    },
    sslValid: {
      type: Boolean,
      default: true,
    },
    sslExpiry: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    failoverCount: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: "",
    },
    dnsRecords: [
      {
        type: {
          type: String,
          enum: ["A", "AAAA", "CNAME", "TXT"],
        },
        name: String,
        value: String,
      },
    ],
    vercelDomainId: {
      type: String,
      default: null,
    },
    vercelVerified: {
      type: Boolean,
      default: false,
    },
    misconfigured: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Ensure only one primary domain
platformDomainSchema.pre("save", async function (next) {
  if (this.type === "primary" && this.isModified("type")) {
    await mongoose.model("PlatformDomain").updateMany({ _id: { $ne: this._id }, type: "primary" }, { type: "backup" })
  }
  next()
})

export default mongoose.models.PlatformDomain || mongoose.model("PlatformDomain", platformDomainSchema)
