const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["elderly", "family", "volunteer"],
      required: true,
    },

    // Family members link to their elderly relative
    linkedElderlyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // GeoJSON point for geospatial queries (volunteers & elderly)
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

    // Volunteer-specific fields
    isVerified: { type: Boolean, default: false },
    idDocumentUrl: { type: String, default: null },
    isAvailable: { type: Boolean, default: true },
    tasksCompleted: { type: Number, default: 0 },

    // For elderly users — preferred language
    language: { type: String, default: "hi" },
  },
  { timestamps: true }
);

// 2dsphere index for geospatial queries
userSchema.index({ location: "2dsphere" });

// Hash password before save
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);