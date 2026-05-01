const { Schema, model } = require("mongoose");

const STATUSES = ["Applied", "Interview", "Offer", "Rejected"];

const jobSchema = new Schema(
  {
    // Every job belongs to exactly one user
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [100, "Company must be 100 characters or fewer"],
    },

    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
      maxlength: [100, "Position must be 100 characters or fewer"],
    },

    status: {
      type: String,
      enum: { values: STATUSES, message: `Status must be one of: ${STATUSES.join(", ")}` },
      default: "Applied",
    },

    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location must be 100 characters or fewer"],
    },

    salary: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, default: "USD", maxlength: 3 },
    },

    url: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, "URL must start with http:// or https://"],
    },

    notes: {
      type: String,
      maxlength: [2000, "Notes must be 2 000 characters or fewer"],
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index — efficiently list a user's jobs sorted by newest first
jobSchema.index({ user: 1, createdAt: -1 });

module.exports = model("Job", jobSchema);
