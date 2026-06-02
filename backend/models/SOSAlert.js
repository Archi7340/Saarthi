const mongoose = require("mongoose");

const sosAlertSchema = new mongoose.Schema(
  {
    elderlyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
      enum: ["active", "resolved"],
      default: "active",
    },
    notifiedFamily: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    notifiedVolunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

sosAlertSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("SOSAlert", sosAlertSchema);