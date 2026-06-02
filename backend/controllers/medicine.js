const MedicineSchedule = require("../models/MedicineSchedule");
const User = require("../models/User");

// @route POST /api/medicine
// @access family only
const createSchedule = async (req, res) => {
  try {
    const { elderlyId, medicineName, dosage, times } = req.body;
    if (!elderlyId || !medicineName || !dosage || !times?.length) {
      return res.status(400).json({ message: "All fields required" });
    }
    const schedule = await MedicineSchedule.create({
      elderlyId,
      createdByFamilyId: req.user._id,
      medicineName,
      dosage,
      times,
    });
    res.status(201).json({ message: "Schedule created", schedule });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/medicine/:elderlyId
// @access elderly or family
const getSchedules = async (req, res) => {
  try {
    const schedules = await MedicineSchedule.find({
      elderlyId: req.params.elderlyId,
      isActive: true,
    }).sort({ createdAt: -1 });
    res.json({ schedules });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PATCH /api/medicine/:scheduleId/acknowledge
// @access elderly only
const acknowledgeMedicine = async (req, res) => {
  try {
    const { scheduledTime, scheduledDate } = req.body;
    const schedule = await MedicineSchedule.findById(req.params.scheduleId);

    if (!schedule) return res.status(404).json({ message: "Schedule not found" });

    // Fallback to current time/date if not provided
    const now = new Date();
    const resolvedDate = scheduledDate || now.toISOString().split("T")[0];
    const resolvedTime = scheduledTime ||
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // Update or push acknowledgement record
    const existing = schedule.acknowledgements.find(
      (a) => a.scheduledTime === resolvedTime && a.scheduledDate === resolvedDate
    );

    if (existing) {
      existing.takenAt = new Date();
      existing.missed = false;
    } else {
      schedule.acknowledgements.push({
        scheduledTime: resolvedTime,
        scheduledDate: resolvedDate,
        takenAt: new Date(),
        missed: false,
      });
    }

    await schedule.save();

    // Find all family members linked to this elderly user
    const familyMembers = await User.find({
      role: "family",
      linkedElderlyId: schedule.elderlyId,
    });

    console.log(`[MedAck] ${familyMembers.length} family members found for elderlyId: ${schedule.elderlyId}`);

    const payload = {
      scheduleId: schedule._id.toString(),
      medicineName: schedule.medicineName,
      dosage: schedule.dosage,
      scheduledTime: resolvedTime,
      scheduledDate: resolvedDate,
      takenAt: new Date(),
      elderlyId: schedule.elderlyId.toString(),
    };

    // Emit to each family member's socket room
    const io = req.io;
    familyMembers.forEach((m) => {
      const room = `family-${m._id.toString()}`;
      console.log(`[MedAck] Emitting med:acknowledged → room: ${room}`);
      io.to(room).emit("med:acknowledged", payload);
    });

    res.json({ message: "Medicine acknowledged", payload });
  } catch (error) {
    console.error("acknowledgeMedicine error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @route PATCH /api/medicine/:scheduleId/toggle
// @access family only
const toggleSchedule = async (req, res) => {
  try {
    const schedule = await MedicineSchedule.findById(req.params.scheduleId);
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });
    schedule.isActive = !schedule.isActive;
    await schedule.save();
    res.json({ message: `Schedule ${schedule.isActive ? "activated" : "deactivated"}`, schedule });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/medicine/:scheduleId
// @access family only
const deleteSchedule = async (req, res) => {
  try {
    await MedicineSchedule.findByIdAndDelete(req.params.scheduleId);
    res.json({ message: "Schedule deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSchedule,
  getSchedules,
  acknowledgeMedicine,
  toggleSchedule,
  deleteSchedule,
};