const mongoose = require("mongoose");

const appIntegrationSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, "App slug is required"],
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "App name is required"],
      trim: true,
    },
    isInstalled: {
      type: Boolean,
      default: false,
    },
    installedAt: {
      type: Date,
      default: null,
    },
    installedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
    connectedAt: {
      type: Date,
      default: null,
    },
    connectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    access: {
      roles: [
        {
          type: String,
          enum: ["Admin", "User"],
        },
      ],
      projects: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Project",
        },
      ],
      teams: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Team",
        },
      ],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("AppIntegration", appIntegrationSchema);
