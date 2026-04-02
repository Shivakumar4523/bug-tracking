const mongoose = require("mongoose");

const taskLinkSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    relationType: {
      type: String,
      enum: ["blocks", "relates-to", "duplicates", "is-blocked-by"],
      default: "relates-to",
    },
  },
  {
    _id: false,
  }
);

const taskAttachmentSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      default: "application/octet-stream",
      trim: true,
    },
    size: {
      type: Number,
      default: 0,
      min: 0,
    },
    dataUrl: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

const taskCommentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
    },
    mentions: [
      {
        type: String,
        trim: true,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

const taskWorkLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    timeSpentHours: {
      type: Number,
      required: true,
      min: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

const taskActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["created", "updated", "commented", "worklogged", "attachment"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      enum: ["task", "bug", "story", "epic"],
      default: "task",
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "review", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by user is required"],
    },
    watchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    startDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    originalEstimateHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    timeSpentHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingEstimateHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    links: [taskLinkSchema],
    labels: [
      {
        type: String,
        trim: true,
      },
    ],
    components: [
      {
        type: String,
        trim: true,
      },
    ],
    fixVersions: [
      {
        type: String,
        trim: true,
      },
    ],
    affectsVersions: [
      {
        type: String,
        trim: true,
      },
    ],
    environment: {
      type: String,
      default: "",
      trim: true,
    },
    attachments: [taskAttachmentSchema],
    comments: [taskCommentSchema],
    workLogs: [taskWorkLogSchema],
    activity: [taskActivitySchema],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Task", taskSchema);
