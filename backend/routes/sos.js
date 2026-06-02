const express = require("express");
const router = express.Router();
const { triggerSOS, resolveSOS, getSOSHistory } = require("../controllers/sos");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

router.post("/trigger", protect, authorize("elderly"), triggerSOS);
router.patch("/:alertId/resolve", protect, authorize("family", "volunteer"), resolveSOS);
router.get("/history/:elderlyId", protect, authorize("family"), getSOSHistory);

module.exports = router;