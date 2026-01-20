import mongoose from "mongoose"

const GuestSessionSchema = new mongoose.Schema(
  {
    gsid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: false,
      index: true,
    },
    session_data: {
      betslip: {
        type: Array,
        default: [],
      },
      totalOdds: {
        type: Number,
        default: 1,
      },
      stake: {
        type: Number,
        default: 0,
      },
      potentialWin: {
        type: Number,
        default: 0,
      },
    },
    expires_at: {
      type: Date,
      required: true,
      index: true,
    },
    ip_address: {
      type: String,
    },
    user_agent: {
      type: String,
    },
    converted_to_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["active", "expired", "converted", "claimed"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
)

// Index for cleanup of expired sessions
GuestSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 })

// Static method to generate unique GSID
GuestSessionSchema.statics.generateGSID = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let gsid = "GS-"
  for (let i = 0; i < 12; i++) {
    gsid += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return gsid
}

// Static method to create new guest session
GuestSessionSchema.statics.createSession = async function (tenant_id, ipAddress, userAgent) {
  const gsid = this.generateGSID()
  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  const session = await this.create({
    gsid,
    tenant_id,
    expires_at,
    ip_address: ipAddress,
    user_agent: userAgent,
  })

  return session
}

// Method to update betslip
GuestSessionSchema.methods.updateBetslip = async function (betslip) {
  this.session_data.betslip = betslip
  await this.save()
  return this
}

// Method to check if session is valid
GuestSessionSchema.methods.isValid = function () {
  return this.status === "active" && new Date() < this.expires_at
}

export default mongoose.models.GuestSession || mongoose.model("GuestSession", GuestSessionSchema)
