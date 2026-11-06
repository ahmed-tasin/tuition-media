
const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createOffer,
  getAllOffers,
  updateOffer,
  deleteOffer,
  getAvailableOffers,
  applyForOffer,
  getMyApplications,
  getOfferApplications,
  selectTutor
} = require("../controllers/tuitionOfferController");

// সব Tuition Offer API-তে Login প্রয়োজন
router.use(protect);

// Admin routes
router.post("/", authorize("admin"), createOffer);
router.get("/admin/all", authorize("admin"), getAllOffers);
router.patch("/:id", authorize("admin"), updateOffer);
router.delete("/:id", authorize("admin"), deleteOffer);

router.get(
  "/admin/:id/applications",
  authorize("admin"),
  getOfferApplications
);

router.post(
  "/admin/select-tutor",
  authorize("admin"),
  selectTutor
);

// Tutor routes
router.get(
  "/available",
  authorize("tutor"),
  getAvailableOffers
);

router.post(
  "/:id/apply",
  authorize("tutor"),
  applyForOffer
);

router.get(
  "/my-applications",
  authorize("tutor"),
  getMyApplications
);

module.exports = router;
