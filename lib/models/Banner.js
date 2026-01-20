import mongoose from "mongoose"

// Delete cached model to prevent schema conflicts
delete mongoose.models.Banner

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    buttonText: {
      type: String,
      default: "Learn More",
    },
    linkUrl: {
      type: String,
      required: true, // Where the banner should navigate to
    },
    linkType: {
      type: String,
      enum: ["betting", "casino", "sports", "custom"],
      default: "custom",
    },
    size: {
      type: String,
      enum: ["small", "medium", "large", "full"],
      default: "large",
    },
    position: {
      type: Number,
      default: 0, // Display order
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Multi-tenancy support
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null, // null = platform-wide banner
    },
    scope: {
      type: String,
      enum: ["platform", "tenant"],
      default: "platform",
    },
    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

bannerSchema.index({ tenantId: 1, isActive: 1, position: 1 })
bannerSchema.index({ scope: 1, isActive: 1 })

export default mongoose.model("Banner", bannerSchema)
