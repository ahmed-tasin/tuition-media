
const User = require("../models/User");

// Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalTutors,
      totalGuardians,
      totalAdmins,
      pendingTutors,
      activeUsers,
      suspendedUsers,
      rejectedTutors,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "tutor" }),
      User.countDocuments({ role: "guardian" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "tutor", status: "pending" }),
      User.countDocuments({ status: "active" }),
      User.countDocuments({ status: "suspended" }),
      User.countDocuments({ role: "tutor", status: "rejected" }),
      User.find()
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalTutors,
        totalGuardians,
        totalAdmins,
        pendingTutors,
        activeUsers,
        suspendedUsers,
        rejectedTutors
      },
      recentUsers
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Dashboard data failed to load"
    });
  }
};

// Get All Users with Search and Filter
exports.getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const search = (req.query.search || "").trim();
    const role = req.query.role;
    const status = req.query.status;

    const filter = {};

    if (["admin", "tutor", "guardian"].includes(role)) {
      filter.role = role;
    }

    if (["active", "pending", "suspended", "rejected"].includes(status)) {
      filter.status = status;
    }

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { phone: { $regex: safeSearch, $options: "i" } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
};

// Get Tutors
exports.getTutors = async (req, res) => {
  try {
    const tutors = await User.find({ role: "tutor" })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: tutors.length, tutors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch tutors" });
  }
};

// Get Guardians
exports.getGuardians = async (req, res) => {
  try {
    const guardians = await User.find({ role: "guardian" })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: guardians.length, guardians });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch guardians" });
  }
};

// Get Pending Tutors
exports.getPendingTutors = async (req, res) => {
  try {
    const tutors = await User.find({
      role: "tutor",
      status: "pending"
    })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: tutors.length, tutors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch pending tutors" });
  }
};

// Update User Status
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "pending", "suspended", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user status"
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin account cannot be changed here"
      });
    }

    if (status === "rejected" && user.role !== "tutor") {
      return res.status(400).json({
        success: false,
        message: "Only tutor applications can be rejected"
      });
    }

    user.status = status;
    await user.save();

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error("Update User Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user status"
    });
  }
};
