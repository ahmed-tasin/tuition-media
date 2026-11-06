
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const normalizePhone = (phone) => {
  let value = String(phone || "").replace(/[\s-]/g, "");

  if (value.startsWith("+88")) {
    value = value.slice(3);
  } else if (value.startsWith("88")) {
    value = value.slice(2);
  }

  return value;
};

// Register
exports.register = async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, phone and password are required"
      });
    }

    const normalizedPhone = normalizePhone(phone);

    if (!/^01[3-9]\d{8}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Bangladesh phone number"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters"
      });
    }

    const allowedRole = ["tutor", "guardian"];

    if (role && !allowedRole.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration role"
      });
    }

    const existingUser = await User.findOne({
      phone: normalizedPhone
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Phone number already registered"
      });
    }

    const selectedRole = role || "guardian";

    // Tutors need admin approval
    const accountStatus =
      selectedRole === "tutor" ? "pending" : "active";

    const user = await User.create({
      name: name.trim(),
      phone: normalizedPhone,
      password,
      role: selectedRole,
      status: accountStatus
    });

    // Only active users receive a login token
    const token =
      accountStatus === "active"
        ? generateToken(user._id)
        : null;

    res.status(201).json({
      success: true,
      message:
        selectedRole === "tutor"
          ? "Registration successful. Please wait for admin approval."
          : "Registration successful",
      ...(token && { token }),
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// Login
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone and password are required"
      });
    }

    const normalizedPhone = normalizePhone(phone);

    const user = await User.findOne({
      phone: normalizedPhone
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password"
      });
    }

if (["suspended", "rejected"].includes(user.status)) {
  return res.status(403).json({
    success: false,
    message:
      user.status === "rejected"
        ? "Your tutor application has been rejected."
        : "Your account has been suspended."
  });
}

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Current user
exports.getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
};