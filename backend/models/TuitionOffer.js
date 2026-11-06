
const mongoose = require("mongoose");

const tuitionOfferSchema = new mongoose.Schema(
  {
    offerCode: {
      type: String,
      unique: true,
      trim: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    classLevel: {
      type: String,
      required: true,
      trim: true
    },

    medium: {
      type: String,
      enum: [
        "Bangla Version",
        "English Version",
        "English Medium",
        "Madrasa",
        "Other"
      ],
      default: "Bangla Version"
    },

    subjects: [{
      type: String,
      trim: true
    }],

    area: {
      type: String,
      required: true,
      trim: true
    },

    salary: {
      type: Number,
      required: true,
      min: 1
    },

    daysPerWeek: {
      type: Number,
      required: true,
      min: 1,
      max: 7
    },

    preferredTutorGender: {
      type: String,
      enum: ["Male", "Female", "Any"],
      default: "Any"
    },

    tutorQualification: {
      type: String,
      default: ""
    },

    description: {
      type: String,
      default: "",
      maxlength: 3000
    },

    deadline: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["open", "paused", "closed"],
      default: "open"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    assignedTutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    assignedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

tuitionOfferSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("TuitionOffer", tuitionOfferSchema);
