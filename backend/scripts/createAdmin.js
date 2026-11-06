require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

const dns = require("node:dns");
dns.setServers(["1.1.1.1"]);

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const name = process.env.ADMIN_NAME;
    const phone = process.env.ADMIN_PHONE;
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !phone || !password) {
      throw new Error("Admin environment variables missing");
    }

    if (password.length < 12) {
      throw new Error("Admin password must be at least 12 characters");
    }

    if (!/^01[3-9]\d{8}$/.test(phone)) {
      throw new Error("Invalid Bangladesh admin phone number");
    }

    const existing = await User.findOne({ phone });

    if (existing) {
      if (existing.role !== "admin") {
        throw new Error("This phone number belongs to another role");
      }

      console.log("Admin account already exists.");
    } else {
      await User.create({
        name,
        phone,
        password,
        role: "admin",
        status: "active",
        isVerified: true
      });

      console.log("Admin account created successfully.");
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();