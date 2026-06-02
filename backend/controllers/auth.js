const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, phone, password, role, linkedElderlyId, language } = req.body;

    if (!name || !phone || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Phone number already registered" });
    }

    // Family must link to an elderly user
    if (role === "family" && !linkedElderlyId) {
      return res.status(400).json({ message: "Family must link to an elderly user ID" });
    }

    // Validate elderly exists
    if (role === "family") {
      const elderly = await User.findById(linkedElderlyId);
      if (!elderly || elderly.role !== "elderly") {
        return res.status(400).json({ message: "Invalid elderly user ID" });
      }
    }

    const user = await User.create({
      name,
      phone,
      password,
      role,
      linkedElderlyId: role === "family" ? linkedElderlyId : null,
      language: language || "hi",
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        role: user.role,
        linkedElderlyId: user.linkedElderlyId
          ? user.linkedElderlyId.toString()
          : null,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Phone and password required" });
    }

    const user = await User.findOne({ phone });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid phone or password" });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        role: user.role,
        linkedElderlyId: user.linkedElderlyId
          ? user.linkedElderlyId.toString()
          : null,
        isVerified: user.isVerified,
        isAvailable: user.isAvailable,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/auth/me
const getMe = async (req, res) => {
  const u = req.user;
  res.json({
    user: {
      _id: u._id.toString(),
      name: u.name,
      phone: u.phone,
      role: u.role,
      linkedElderlyId: u.linkedElderlyId ? u.linkedElderlyId.toString() : null,
      isVerified: u.isVerified,
      isAvailable: u.isAvailable,
      tasksCompleted: u.tasksCompleted,
      language: u.language,
    },
  });
};

module.exports = { register, login, getMe };