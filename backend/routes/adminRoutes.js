const express = require("express");
const router = express.Router();

const {
  protect,
  authorize
} = require("../middleware/authMiddleware");

const {
  getDashboardStats,
  getAllUsers,
  getTutors,
  getGuardians,
  getPendingTutors,
  updateUserStatus
} = require("../controllers/adminController");

// All routes require Admin login
router.use(protect, authorize("admin"));

router.get("/dashboard", getDashboardStats);

router.get("/users", getAllUsers);

router.get("/tutors", getTutors);

router.get("/guardians", getGuardians);

router.get("/tutors/pending", getPendingTutors);

router.patch("/users/:id/status", updateUserStatus);

module.exports = router;