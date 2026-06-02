const express = require("express");
const router = express.Router();
const {
  updateLocation,
  toggleAvailability,
  uploadID,
  getProfile,
} = require("../controllers/volunteer");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");
const { upload } = require("../config/cloudinary");

router.patch("/location", protect, authorize("volunteer"), updateLocation);
router.patch("/availability", protect, authorize("volunteer"), toggleAvailability);
router.post("/upload-id", protect, authorize("volunteer"), upload.single("idDocument"), uploadID);
router.get("/profile", protect, authorize("volunteer"), getProfile);

module.exports = router;