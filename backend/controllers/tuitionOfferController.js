
const mongoose = require("mongoose");
const TuitionOffer = require("../models/TuitionOffer");
const TuitionApplication = require("../models/TuitionApplication");
const User = require("../models/User");

// Generate offer code
const generateOfferCode = () => {
  return `TM-${Date.now().toString().slice(-8)}`;
};

// ===============================
// ADMIN: CREATE OFFER
// ===============================
exports.createOffer = async (req, res) => {
  try {
    const {
      title,
      classLevel,
      medium,
      subjects,
      area,
      salary,
      daysPerWeek,
      preferredTutorGender,
      tutorQualification,
      description,
      deadline
    } = req.body;

    if (
      !title ||
      !classLevel ||
      !area ||
      !salary ||
      !daysPerWeek ||
      !deadline ||
      !Array.isArray(subjects) ||
      subjects.filter(Boolean).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required offer information"
      });
    }

    const parsedSalary = Number(salary);
    const parsedDays = Number(daysPerWeek);
    const parsedDeadline = new Date(deadline);

    if (!Number.isFinite(parsedSalary) || parsedSalary < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid salary"
      });
    }

    if (!Number.isInteger(parsedDays) || parsedDays < 1 || parsedDays > 7) {
      return res.status(400).json({
        success: false,
        message: "Days per week must be between 1 and 7"
      });
    }

    if (
      Number.isNaN(parsedDeadline.getTime()) ||
      parsedDeadline <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Deadline must be a future date"
      });
    }

    const offer = await TuitionOffer.create({
      offerCode: generateOfferCode(),
      title,
      classLevel,
      medium,
      subjects: subjects.map((subject) => String(subject).trim()).filter(Boolean),
      area,
      salary: parsedSalary,
      daysPerWeek: parsedDays,
      preferredTutorGender,
      tutorQualification,
      description,
      deadline: parsedDeadline,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Tuition offer created successfully",
      offer
    });
  } catch (error) {
    console.error("Create Offer Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create tuition offer"
    });
  }
};

// ===============================
// ADMIN: GET ALL OFFERS
// ===============================
exports.getAllOffers = async (req, res) => {
  try {
    const offers = await TuitionOffer.find()
      .populate("assignedTutor", "name phone")
      .sort({ createdAt: -1 })
      .lean();

    const offerIds = offers.map((offer) => offer._id);

    const counts = await TuitionApplication.aggregate([
      { $match: { offer: { $in: offerIds } } },
      { $group: { _id: "$offer", count: { $sum: 1 } } }
    ]);

    const countMap = new Map(
      counts.map((item) => [String(item._id), item.count])
    );

    res.json({
      success: true,
      count: offers.length,
      offers: offers.map((offer) => ({
        ...offer,
        applicationCount: countMap.get(String(offer._id)) || 0
      }))
    });
  } catch (error) {
    console.error("Get All Offers Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch tuition offers"
    });
  }
};

// ===============================
// ADMIN: UPDATE OFFER
// ===============================
exports.updateOffer = async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "classLevel",
      "medium",
      "subjects",
      "area",
      "salary",
      "daysPerWeek",
      "preferredTutorGender",
      "tutorQualification",
      "description",
      "deadline",
      "status"
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (
      updates.status &&
      !["open", "paused", "closed"].includes(updates.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer status"
      });
    }

    if (updates.salary !== undefined) {
      updates.salary = Number(updates.salary);
      if (!Number.isFinite(updates.salary) || updates.salary < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid salary"
        });
      }
    }

    if (updates.daysPerWeek !== undefined) {
      updates.daysPerWeek = Number(updates.daysPerWeek);
      if (
        !Number.isInteger(updates.daysPerWeek) ||
        updates.daysPerWeek < 1 ||
        updates.daysPerWeek > 7
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid days per week"
        });
      }
    }

    if (updates.deadline !== undefined) {
      updates.deadline = new Date(updates.deadline);

      if (
        Number.isNaN(updates.deadline.getTime()) ||
        updates.deadline <= new Date()
      ) {
        return res.status(400).json({
          success: false,
          message: "Deadline must be a future date"
        });
      }
    }

    const offer = await TuitionOffer.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Tuition offer not found"
      });
    }

    res.json({
      success: true,
      message: "Offer updated successfully",
      offer
    });
  } catch (error) {
    console.error("Update Offer Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update offer"
    });
  }
};

// ===============================
// ADMIN: DELETE OFFER
// ===============================
exports.deleteOffer = async (req, res) => {
  try {
    const offer = await TuitionOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found"
      });
    }

    await TuitionApplication.deleteMany({ offer: offer._id });
    await offer.deleteOne();

    res.json({
      success: true,
      message: "Offer and its applications deleted"
    });
  } catch (error) {
    console.error("Delete Offer Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete offer"
    });
  }
};

// ===============================
// TUTOR: GET AVAILABLE OFFERS
// ===============================
exports.getAvailableOffers = async (req, res) => {
  try {
    const offers = await TuitionOffer.find({
      status: "open",
      deadline: { $gt: new Date() }
    })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    const offerIds = offers.map((offer) => offer._id);

    const myApplications = await TuitionApplication.find({
      tutor: req.user._id,
      offer: { $in: offerIds }
    }).select("offer status");

    const applicationMap = new Map(
      myApplications.map((item) => [
        String(item.offer),
        item.status
      ])
    );

    res.json({
      success: true,
      offers: offers.map((offer) => ({
        ...offer,
        hasApplied: applicationMap.has(String(offer._id)),
        myApplicationStatus:
          applicationMap.get(String(offer._id)) || null
      }))
    });
  } catch (error) {
    console.error("Available Offers Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch available offers"
    });
  }
};

// ===============================
// TUTOR: APPLY FOR OFFER
// ===============================
exports.applyForOffer = async (req, res) => {
  try {
    if (req.user.role !== "tutor") {
      return res.status(403).json({
        success: false,
        message: "Only tutors can apply"
      });
    }

    if (req.user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Only approved tutors can apply"
      });
    }

    const offer = await TuitionOffer.findOne({
      _id: req.params.id,
      status: "open",
      deadline: { $gt: new Date() }
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer is unavailable or deadline has passed"
      });
    }

    const application = await TuitionApplication.create({
      offer: offer._id,
      tutor: req.user._id,
      message: String(req.body.message || "").trim()
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already applied for this offer"
      });
    }

    console.error("Apply Offer Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to submit application"
    });
  }
};

// ===============================
// TUTOR: MY APPLICATIONS
// ===============================
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await TuitionApplication.find({
      tutor: req.user._id
    })
      .populate("offer")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error("My Applications Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch applications"
    });
  }
};

// ===============================
// ADMIN: VIEW APPLICATIONS
// ===============================
exports.getOfferApplications = async (req, res) => {
  try {
    const offer = await TuitionOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found"
      });
    }

    const applications = await TuitionApplication.find({
      offer: offer._id
    })
      .populate("tutor", "name phone address status createdAt")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      offer,
      count: applications.length,
      applications
    });
  } catch (error) {
    console.error("Offer Applications Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch applications"
    });
  }
};

// ===============================
// ADMIN: SELECT TUTOR
// ===============================
exports.selectTutor = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { applicationId } = req.body;

    if (!mongoose.isValidObjectId(applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID"
      });
    }

    let result;

    await session.withTransaction(async () => {
      const application = await TuitionApplication.findById(applicationId)
        .session(session);

      if (!application) {
        throw new Error("APPLICATION_NOT_FOUND");
      }

      const offer = await TuitionOffer.findById(application.offer)
        .session(session);

      if (!offer) {
        throw new Error("OFFER_NOT_FOUND");
      }

      if (offer.status !== "open" || offer.assignedTutor) {
        throw new Error("OFFER_ALREADY_ASSIGNED_OR_CLOSED");
      }

      const tutor = await User.findOne({
        _id: application.tutor,
        role: "tutor",
        status: "active"
      }).session(session);

      if (!tutor) {
        throw new Error("TUTOR_NOT_ACTIVE");
      }

      await TuitionApplication.updateMany(
        { offer: offer._id },
        { $set: { status: "rejected" } },
        { session }
      );

      application.status = "selected";
      await application.save({ session });

      offer.assignedTutor = tutor._id;
      offer.assignedAt = new Date();
      offer.status = "closed";
      await offer.save({ session });

      result = {
        offerId: offer._id,
        tutorId: tutor._id,
        tutorName: tutor.name
      };
    });

    res.json({
      success: true,
      message: "Tutor selected and assigned successfully",
      assignment: result
    });
  } catch (error) {
    console.error("Select Tutor Error:", error);

    const messages = {
      APPLICATION_NOT_FOUND: [404, "Application not found"],
      OFFER_NOT_FOUND: [404, "Offer not found"],
      OFFER_ALREADY_ASSIGNED_OR_CLOSED: [409, "Offer is already assigned or closed"],
      TUTOR_NOT_ACTIVE: [409, "Tutor is not active"]
    };

    const [statusCode, message] =
      messages[error.message] || [500, "Failed to assign tutor"];

    res.status(statusCode).json({
      success: false,
      message
    });
  } finally {
    await session.endSession();
  }
};
