import mongoose from "mongoose"

const IpAllowlistSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["ipv4", "ipv6", "cidr"],
      default: "ipv4",
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    addedByEmail: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastAccessedAt: {
      type: Date,
    },
    accessCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

// Check if IP matches (supports CIDR notation)
IpAllowlistSchema.statics.isIpAllowed = async function (ip) {
  // Always allow localhost in development
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") {
    return true
  }

  const allowedIps = await this.find({ isActive: true })

  // If no IPs in allowlist, allow all (for initial setup)
  if (allowedIps.length === 0) {
    return true
  }

  for (const entry of allowedIps) {
    // Check expiry
    if (entry.expiresAt && new Date() > entry.expiresAt) {
      continue
    }

    if (entry.type === "cidr") {
      if (ipMatchesCidr(ip, entry.ip)) {
        // Update access stats
        await this.findByIdAndUpdate(entry._id, {
          lastAccessedAt: new Date(),
          $inc: { accessCount: 1 },
        })
        return true
      }
    } else {
      if (ip === entry.ip) {
        // Update access stats
        await this.findByIdAndUpdate(entry._id, {
          lastAccessedAt: new Date(),
          $inc: { accessCount: 1 },
        })
        return true
      }
    }
  }

  return false
}

// Helper function to check CIDR match
function ipMatchesCidr(ip, cidr) {
  try {
    const [range, bits] = cidr.split("/")
    const mask = Number.parseInt(bits, 10)

    const ipParts = ip.split(".").map(Number)
    const rangeParts = range.split(".").map(Number)

    const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]
    const rangeNum = (rangeParts[0] << 24) | (rangeParts[1] << 16) | (rangeParts[2] << 8) | rangeParts[3]
    const maskNum = (-1 << (32 - mask)) >>> 0

    return (ipNum & maskNum) === (rangeNum & maskNum)
  } catch {
    return false
  }
}

export default mongoose.models.IpAllowlist || mongoose.model("IpAllowlist", IpAllowlistSchema)
