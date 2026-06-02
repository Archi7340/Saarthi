const mongoose = require("mongoose");

const helpRequestSchema = new mongoose.Schema(
  {
    elderlyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: ["medicine", "grocery", "doctor", "technical", "other"],
      required: true,
    },
    description: { type: String, default: "" },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["open", "accepted", "completed", "expired"],
      default: "open",
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    acceptedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    // Auto-expanding radius logic
    // Starts at 2km, expands to 5km after 10 min, then 10km after 20 min
    searchRadiusKm: { type: Number, default: 2 },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 min total
    },
  },
  { timestamps: true }
);

helpRequestSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("HelpRequest", helpRequestSchema);