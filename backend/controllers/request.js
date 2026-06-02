const HelpRequest = require("../models/HelpRequest");
const User = require("../models/User");
const { findNearbyVolunteers, findNearbyVolunteersSOS, findFamilyMembers } = require("../utils/geoQuery");

// @route POST /api/requests
// @access elderly only
const createRequest = async (req, res) => {
  try {
    const { category, description, coordinates } = req.body;

    if (!category || !coordinates) {
      return res.status(400).json({ message: "category and coordinates required" });
    }

    const request = await HelpRequest.create({
      elderlyId: req.user._id,
      category,
      description: description || "",
      location: { type: "Point", coordinates },
      searchRadiusKm: 2,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const io = req.io;
    const mapsLink = `https://maps.google.com/?q=${coordinates[1]},${coordinates[0]}`;

    // Try nearby first, fall back to all volunteers (same as SOS)
    let volunteers = await findNearbyVolunteers(coordinates, 5, 10);
    if (volunteers.length === 0) {
      console.log("[Request] No nearby volunteers — notifying all volunteers");
      volunteers = await User.find({ role: "volunteer" }).limit(20);
    }

    console.log(`[Request] Notifying ${volunteers.length} volunteers for ${category} request`);

    const payload = {
      requestId: request._id.toString(),
      category: request.category,
      description: request.description,
      elderlyName: req.user.name,
      elderlyPhone: req.user.phone,       // ← contact info
      elderlyId: req.user._id.toString(),
      coordinates,
      mapsLink,
      createdAt: request.createdAt,
      expiresAt: request.expiresAt,
    };

    volunteers.forEach((v) => {
      const room = `volunteer-${v._id.toString()}`;
      console.log(`[Request] Emitting request:new → ${room}`);
      io.to(room).emit("request:new", payload);
    });

    res.status(201).json({ message: "Request created", request });
  } catch (error) {
    console.error("createRequest error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @route PATCH /api/requests/:id/accept
// @access volunteer only
const acceptRequest = async (req, res) => {
  try {
    const request = await HelpRequest.findById(req.params.id)
      .populate("elderlyId", "name phone");

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "open") {
      return res.status(400).json({ message: "Request already accepted or closed" });
    }
    if (new Date() > request.expiresAt) {
      return res.status(400).json({ message: "Request has expired" });
    }

    request.status = "accepted";
    request.acceptedBy = req.user._id;
    request.acceptedAt = new Date();
    await request.save();

    const io = req.io;

    // Notify the elderly user
    io.to(`elderly-${request.elderlyId._id.toString()}`).emit("request:status", {
      requestId: request._id.toString(),
      status: "accepted",
      volunteerName: req.user.name,
      volunteerPhone: req.user.phone,
    });

    // Notify family members
    const familyMembers = await findFamilyMembers(request.elderlyId._id);
    familyMembers.forEach((m) => {
      io.to(`family-${m._id.toString()}`).emit("request:status", {
        requestId: request._id.toString(),
        status: "accepted",
        volunteerName: req.user.name,
        category: request.category,
        elderlyName: request.elderlyId.name,
      });
    });

    res.json({ message: "Request accepted", request });
  } catch (error) {
    console.error("acceptRequest error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @route PATCH /api/requests/:id/complete
// @access volunteer only
const completeRequest = async (req, res) => {
  try {
    const request = await HelpRequest.findById(req.params.id)
      .populate("elderlyId", "name");

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (String(request.acceptedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    request.status = "completed";
    request.completedAt = new Date();
    await request.save();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { tasksCompleted: 1 },
    });

    const io = req.io;
    io.to(`elderly-${request.elderlyId._id.toString()}`).emit("request:status", {
      requestId: request._id.toString(),
      status: "completed",
      volunteerName: req.user.name,
    });

    const familyMembers = await findFamilyMembers(request.elderlyId._id);
    familyMembers.forEach((m) => {
      io.to(`family-${m._id.toString()}`).emit("request:status", {
        requestId: request._id.toString(),
        status: "completed",
        volunteerName: req.user.name,
        category: request.category,
        elderlyName: request.elderlyId.name,
      });
    });

    res.json({ message: "Request completed", request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/requests/elderly/:elderlyId
// @access elderly or family
const getElderlyRequests = async (req, res) => {
  try {
    const requests = await HelpRequest.find({ elderlyId: req.params.elderlyId })
      .populate("acceptedBy", "name phone")
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/requests/nearby
// @access volunteer only
const getNearbyRequests = async (req, res) => {
  try {
    const { lng, lat, radius = 10 } = req.query;

    let requests;
    if (lng && lat) {
      requests = await HelpRequest.find({
        status: "open",
        expiresAt: { $gt: new Date() },
        location: {
          $nearSphere: {
            $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseFloat(radius) * 1000,
          },
        },
      })
        .populate("elderlyId", "name phone")
        .limit(10);
    } else {
      // No coords provided — return all open requests
      requests = await HelpRequest.find({
        status: "open",
        expiresAt: { $gt: new Date() },
      })
        .populate("elderlyId", "name phone")
        .sort({ createdAt: -1 })
        .limit(10);
    }

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRequest,
  acceptRequest,
  completeRequest,
  getElderlyRequests,
  getNearbyRequests,
};