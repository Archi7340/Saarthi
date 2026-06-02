const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Socket.io handler
 * Room naming convention:
 *   elderly-{userId}
 *   family-{userId}
 *   volunteer-{userId}
 *
 * Each user joins their personal room on connect.
 * This allows targeted emits from controllers.
 */
const initSocketHandler = (io) => {
  // Middleware: authenticate socket connection via JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token provided"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const { _id, role, name } = socket.user;
    console.log(`Socket connected: ${name} (${role}) — ${socket.id}`);

    // Force _id to string — Mongoose ObjectId must be explicit
    const userId = _id.toString();
    const personalRoom = `${role}-${userId}`;
    socket.join(personalRoom);
    console.log(`${name} joined room: ${personalRoom}`);

    // When volunteer connects, automatically mark them available
    if (role === "volunteer") {
      User.findByIdAndUpdate(userId, { isAvailable: true }).catch(console.error);
      console.log(`[Volunteer] ${name} marked available on connect`);
    }

    // ─── Volunteer events ────────────────────────────────────────────────────

    // Volunteer updates their live location every 30s
    socket.on("location:update", async (data) => {
      const { coordinates } = data;
      if (!coordinates) return;
      try {
        await User.findByIdAndUpdate(userId, {
          isAvailable: true,
          location: { type: "Point", coordinates },
        });
        console.log(`[Volunteer] ${name} location updated: ${coordinates}`);
      } catch (err) {
        console.error("location:update error", err.message);
      }
    });

    socket.on("volunteer:available", async (data) => {
      const { isAvailable } = data;
      try {
        await User.findByIdAndUpdate(userId, { isAvailable });
        socket.emit("volunteer:available:ack", { isAvailable });
      } catch (err) {
        console.error("volunteer:available error", err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${name} (${role})`);
      if (role === "volunteer") {
        User.findByIdAndUpdate(userId, { isAvailable: false }).catch(console.error);
      }
    });
  });
};

module.exports = initSocketHandler;