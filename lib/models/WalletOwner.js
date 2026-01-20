import mongoose from "mongoose"

const WalletOwnerSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },
    ownerType: {
      type: String,
      enum: [
        "SYSTEM",
        "TENANT",
        "PARTNER",
        "AGENT_MASTER",
        "AGENT_REGULAR",
        "AGENT_SUB",
        "PLAYER",
        "GUEST_SLIP",
        "JACKPOT_POOL",
        "COMMISSION_POOL",
        "TAX_POOL",
      ],
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

WalletOwnerSchema.index({ ownerType: 1, ownerId: 1 })
WalletOwnerSchema.index({ walletId: 1, ownerType: 1, ownerId: 1 }, { unique: true })

export default mongoose.models.WalletOwner || mongoose.model("WalletOwner", WalletOwnerSchema)
