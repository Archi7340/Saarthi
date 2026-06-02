const SOSAlert = require("../models/SOSAlert");
const { findNearbyVolunteersSOS, findFamilyMembers } = require("../utils/geoQuery");
const { sendSMS } = require("../utils/twilio");

// @route POST /api/sos/trigger
// @access elderly only
const triggerSOS = async (req, res) => {
  try {
    const elderlyId = req.user._id;
    const { coordinates } = req.body; // [lng, lat]

    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({ message: "coordinates [lng, lat] required" });
    }

    // Create SOS alert in DB
    const alert = await SOSAlert.create({
      elderlyId,
      location: { type: "Point", coordinates },
      status: "active",
    });

    // Find family members linked to this elderly
    const familyMembers = await findFamilyMembers(elderlyId);

    // Find nearby volunteers — progressive radius, no isVerified/isAvailable filter
    const volunteers = await findNearbyVolunteersSOS(coordinates);

    // Update the alert with notified lists
    alert.notifiedFamily = familyMembers.map((f) => f._id);
    alert.notifiedVolunteers = volunteers.map((v) => v._id);
    await alert.save();

    const elderlyName = req.user.name;
    const elderlyPhone = req.user.phone;
    const mapsLink = `https://maps.google.com/?q=${coordinates[1]},${coordinates[0]}`;

    // Emit via Socket.io to family rooms
    const io = req.io;
    familyMembers.forEach((member) => {
      io.to(`family-${member._id.toString()}`).emit("sos:alert-family", {
        alertId: alert._id.toString(),
        elderlyId: elderlyId.toString(),
        elderlyName,
        elderlyPhone,
        coordinates,
        mapsLink,
        triggeredAt: alert.createdAt,
      });
    });

    // Emit to nearby volunteers
    volunteers.forEach((volunteer) => {
      io.to(`volunteer-${volunteer._id.toString()}`).emit("sos:alert-volunteer", {
        alertId: alert._id.toString(),
        elderlyId: elderlyId.toString(),
        elderlyName,
        elderlyPhone,
        coordinates,
        mapsLink,
        triggeredAt: alert.createdAt,
      });
    });

    // Send SMS to family members
    for (const member of familyMembers) {
      await sendSMS(
        member.phone,
        `🚨 SAARTHI SOS ALERT\n${elderlyName} needs emergency help!\nLocation: ${mapsLink}\nPlease respond immediately.`
      );
    }

    res.status(201).json({
      message: "SOS triggered successfully",
      alertId: alert._id,
      familyNotified: familyMembers.length,
      volunteersNotified: volunteers.length,
    });
  } catch (error) {
    console.error("SOS trigger error:", error.message, error.stack);
    res.status(500).json({ message: error.message });
  }
};

// @route PATCH /api/sos/:alertId/resolve
// @access family or volunteer
const resolveSOS = async (req, res) => {
  try {
    const alert = await SOSAlert.findById(req.params.alertId);
    if (!alert) return res.status(404).json({ message: "Alert not found" });
    if (alert.status === "resolved") {
      return res.status(400).json({ message: "Alert already resolved" });
    }

    alert.status = "resolved";
    alert.resolvedBy = req.user._id;
    alert.resolvedAt = new Date();
    await alert.save();

    // Notify all related rooms that SOS is resolved
    const io = req.io;
    io.to(`elderly-${alert.elderlyId}`).emit("sos:resolved", {
      alertId: alert._id,
      resolvedBy: req.user.name,
    });

    const familyMembers = await findFamilyMembers(alert.elderlyId);
    familyMembers.forEach((m) => {
      io.to(`family-${m._id}`).emit("sos:resolved", {
        alertId: alert._id,
        resolvedBy: req.user.name,
      });
    });

    res.json({ message: "SOS resolved", alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/sos/history/:elderlyId
// @access family
const getSOSHistory = async (req, res) => {
  try {
    const alerts = await SOSAlert.find({ elderlyId: req.params.elderlyId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { triggerSOS, resolveSOS, getSOSHistory };