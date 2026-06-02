require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
// const dotenv = require("dotenv");
const connectDB = require("./config/db");
const initSocketHandler = require("./sockets/sockethandler");
const { startMedicineReminderJob } = require("./jobs/medicineReminder");
// ROUTES
const authRoutes = require("./routes/auth");
const sosRoutes = require("./routes/sos");
const requestRoutes = require("./routes/request");
const medicineRoutes = require("./routes/medicine");
const volunteerRoutes = require("./routes/Volunteer");

// dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

// Attach io to req so controllers can emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

//API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/medicine", medicineRoutes);
app.use("/api/volunteers", volunteerRoutes);

app.get("/", (req, res) => res.json({ message: "Saarthi API running" }));

// app.get("/test-sms", async (req, res) => {
//   const { sendSMS } = require("./utils/twilio");

//   await sendSMS(
//     "+917340579110",
//     "Saarthi SMS test successful"
//   );
  

  

//   res.send("SMS test triggered");
// });



// Socket.io handler
initSocketHandler(io);
 
// Start cron jobs — pass io so cron can emit socket events
startMedicineReminderJob(io);


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Saarthi server running on port ${PORT}`);
});

