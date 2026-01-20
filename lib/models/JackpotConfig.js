import mongoose from "mongoose"

const jackpotConfigSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      unique: true,
    },
    enabled: { type: Boolean, default: true },
    megaJackpot: {
      label: { type: String, default: "MEGA JACKPOT" },
      amount: { type: Number, default: 2847392 },
      active: { type: Boolean, default: true },
    },
    dailyJackpot: {
      label: { type: String, default: "DAILY JACKPOT" },
      amount: { type: Number, default: 47293 },
      active: { type: Boolean, default: true },
    },
    hourlyJackpot: {
      label: { type: String, default: "HOURLY JACKPOT" },
      amount: { type: Number, default: 3847 },
      active: { type: Boolean, default: true },
    },
    autoIncrement: {
      enabled: { type: Boolean, default: true },
      megaRate: { type: Number, default: 100 },
      dailyRate: { type: Number, default: 10 },
      hourlyRate: { type: Number, default: 5 },
      interval: { type: Number, default: 3000 },
    },
  },
  { timestamps: true },
)

export default mongoose.models.JackpotConfig || mongoose.model("JackpotConfig", jackpotConfigSchema)
