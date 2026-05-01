const mongoose = require("mongoose");

const JOB_STATUSES = ["Applied", "Interview", "Offer", "Rejected"];

const jobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
      maxlength: [100, "Position cannot exceed 100 characters"],
    },
    status: {
      type: String,
      enum: {
        values: JOB_STATUSES,
        message: `Status must be one of: ${JOB_STATUSES.join(", ")}`,
      },
      default: "Applied",
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    url: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, "Please enter a valid URL starting with http(s)://"],
    },
    salary: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, default: "USD", maxlength: 3 },
    },
    notes: {
      type: String,
      maxlength: [2000, "Notes cannot exceed 2000 characters"],
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    nextStep: {
      type: String,
      maxlength: [200, "Next step cannot exceed 200 characters"],
    },
    tags: [{ type: String, trim: true, maxlength: 30 }],
  },
  { timestamps: true }
);

// Compound index for efficient user-based queries with sorting
jobSchema.index({ user: 1, createdAt: -1 });
jobSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("Job", jobSchema);
