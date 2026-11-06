
const mongoose = require("mongoose");

const tuitionApplicationSchema = new mongoose.Schema(
  {
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TuitionOffer",
      required: true
    },

    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    message: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ""
    },

    status: {
      type: String,
      enum: ["pending", "selected", "rejected"],
      default: "pending"
    },

    appliedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// একজন Tutor একটি Offer-এ একবারই Apply করতে পারবে
tuitionApplicationSchema.index(
  { offer: 1, tutor: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "TuitionApplication",
  tuitionApplicationSchema
);
