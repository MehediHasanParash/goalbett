import mongoose from "mongoose"

const SportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    icon: {
      type: String,
      default: "",
    },
    // Display order
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Sport category
    category: {
      type: String,
      enum: ["sports", "esports", "virtual", "casino", "racing"],
      default: "sports",
    },
    // Featured sport (show in top navigation)
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // Available markets for this sport
    availableMarkets: [
      {
        type: String,
      },
    ],
    // Metadata
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Sport || mongoose.model("Sport", SportSchema)
