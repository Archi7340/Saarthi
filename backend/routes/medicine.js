const express = require("express");
const router = express.Router();
const {
  createSchedule,
  getSchedules,
  acknowledgeMedicine,
  toggleSchedule,
  deleteSchedule,
} = require("../controllers/medicine");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

router.post("/", protect, authorize("family"), createSchedule);
router.get("/:elderlyId", protect, authorize("elderly", "family"), getSchedules);
router.patch("/:scheduleId/acknowledge", protect, authorize("elderly"), acknowledgeMedicine);
router.patch("/:scheduleId/toggle", protect, authorize("family"), toggleSchedule);
router.delete("/:scheduleId", protect, authorize("family"), deleteSchedule);

module.exports = router;