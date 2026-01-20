import mongoose from "mongoose"

const TenantConfigSchema = new mongoose.Schema(
  {
    tenant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    description: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Compound index for fast lookups
TenantConfigSchema.index({ tenant_id: 1, key: 1 }, { unique: true })

// Helper methods
TenantConfigSchema.statics.getConfig = async function (tenantId, key) {
  const config = await this.findOne({ tenant_id: tenantId, key, isActive: true })
  return config ? config.value : null
}

TenantConfigSchema.statics.setConfig = async function (tenantId, key, value, description = "") {
  const existing = await this.findOne({ tenant_id: tenantId, key })

  if (existing) {
    existing.value = value
    existing.version += 1
    if (description) existing.description = description
    return await existing.save()
  }

  return await this.create({
    tenant_id: tenantId,
    key,
    value,
    description,
  })
}

TenantConfigSchema.statics.getAllConfigs = async function (tenantId) {
  const configs = await this.find({ tenant_id: tenantId, isActive: true })
  return configs.reduce((acc, config) => {
    acc[config.key] = config.value
    return acc
  }, {})
}

export default mongoose.models.TenantConfig || mongoose.model("TenantConfig", TenantConfigSchema)
