const User = require("../models/User");
const { upload } = require("../config/cloudinary");

// @route PATCH /api/volunteers/location
// @access volunteer only
const updateLocation = async (req, res) => {
  try {
    const { coordinates } = req.body; // [lng, lat]

    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({ message: "coordinates [lng, lat] required" });
    }

    await User.findByIdAndUpdate(req.user._id, {
      location: { type: "Point", coordinates },
    });

    res.json({ message: "Location updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PATCH /api/volunteers/availability
// @access volunteer only
const toggleAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.isAvailable = !user.isAvailable;
    await user.save();

    res.json({ isAvailable: user.isAvailable });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/volunteers/upload-id
// @access volunteer only
const uploadID = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "ID document file required" });
    }

    await User.findByIdAndUpdate(req.user._id, {
      idDocumentUrl: req.file.path,
    });

    res.json({
      message: "ID uploaded. Awaiting manual verification.",
      url: req.file.path,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/volunteers/profile
// @access volunteer only
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({ volunteer: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { updateLocation, toggleAvailability, uploadID, getProfile };