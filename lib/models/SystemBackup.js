import mongoose from "mongoose"

const SystemBackupSchema = new mongoose.Schema(
  {
    backupId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["full", "incremental", "manual", "scheduled", "continuous"],
      default: "manual",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "failed", "cancelled"],
      default: "pending",
    },
    size: {
      type: String,
      default: "Calculating...",
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      default: "MongoDB Atlas",
    },
    provider: {
      type: String,
      enum: ["mongodb_atlas", "aws_s3", "google_cloud", "azure", "local"],
      default: "mongodb_atlas",
    },
    initiatedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      email: String,
      role: String,
      source: {
        type: String,
        enum: ["manual", "scheduled", "system", "api"],
        default: "manual",
      },
    },
    metadata: {
      collections: [String],
      documentCount: Number,
      compressionType: String,
      encryptionEnabled: {
        type: Boolean,
        default: true,
      },
      retentionDays: {
        type: Number,
        default: 30,
      },
    },
    timing: {
      startedAt: Date,
      completedAt: Date,
      durationMs: Number,
    },
    restore: {
      canRestore: {
        type: Boolean,
        default: true,
      },
      lastRestoredAt: Date,
      restoreCount: {
        type: Number,
        default: 0,
      },
    },
    notes: String,
    errorMessage: String,
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
SystemBackupSchema.index({ createdAt: -1 })
SystemBackupSchema.index({ status: 1, createdAt: -1 })
SystemBackupSchema.index({ type: 1, createdAt: -1 })

export default mongoose.models.SystemBackup || mongoose.model("SystemBackup", SystemBackupSchema)
