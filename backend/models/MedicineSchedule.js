const mongoose = require("mongoose");

const acknowledgementSchema = new mongoose.Schema({
  scheduledTime: String, // e.g. "08:00"
  scheduledDate: String, // e.g. "2024-01-15"
  takenAt: { type: Date, default: null },
  missed: { type: Boolean, default: false },
  smsSentToElderly: { type: Boolean, default: false },
  familyNotified: { type: Boolean, default: false },
});

const medicineScheduleSchema = new mongoose.Schema(
  {
    elderlyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByFamilyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    medicineName: { type: String, required: true, trim: true },
    dosage: { type: String, required: true }, // e.g. "1 tablet", "5ml"
    times: [String], // e.g. ["08:00", "14:00", "21:00"]
    isActive: { type: Boolean, default: true },
    acknowledgements: [acknowledgementSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicineSchedule", medicineScheduleSchema);