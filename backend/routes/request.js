const express = require("express");
const router = express.Router();
const {
  createRequest,
  acceptRequest,
  completeRequest,
  getElderlyRequests,
  getNearbyRequests,
} = require("../controllers/request");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

router.post("/", protect, authorize("elderly"), createRequest);
router.patch("/:id/accept", protect, authorize("volunteer"), acceptRequest);
router.patch("/:id/complete", protect, authorize("volunteer"), completeRequest);
router.get("/elderly/:elderlyId", protect, authorize("elderly", "family"), getElderlyRequests);
router.get("/nearby", protect, authorize("volunteer"), getNearbyRequests);

module.exports = router;