import mongoose from "mongoose"

const DomainSchema = new mongoose.Schema(
  {
    domain: { type: String, required: true, unique: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
    tenantName: { type: String },
    status: {
      type: String,
      enum: ["healthy", "blocked", "degraded", "checking"],
      default: "checking",
    },
    isPrimary: { type: Boolean, default: false },
    lastCheck: { type: Date },
    responseTime: { type: Number }, // ms
    sslValid: { type: Boolean, default: false },
    sslExpiry: { type: Date },
    blockedAt: { type: Date },
    blockedReason: { type: String },
  },
  { timestamps: true },
)

export default mongoose.models.Domain || mongoose.model("Domain", DomainSchema)
