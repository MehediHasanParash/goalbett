import mongoose from "mongoose"

const LeagueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    sportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sport",
      required: true,
      index: true,
    },
    country: {
      type: String,
      default: "",
      index: true,
    },
    countryCode: {
      type: String,
      default: "",
    },
    logo: {
      type: String,
      default: "",
    },
    // Display order within sport
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Featured league (popular)
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // Season info
    season: {
      name: String,
      startDate: Date,
      endDate: Date,
    },
    // External provider ID (for API integration later)
    externalId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// Compound index for sport + active leagues
LeagueSchema.index({ sportId: 1, isActive: 1, order: 1 })

export default mongoose.models.League || mongoose.model("League", LeagueSchema)
