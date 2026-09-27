const express = require("express");
const Tour = require("../models/Tour");
const { TourBooking } = require("../models/Booking");
const { authenticate, authorize } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = { approvalStatus: "approved", isActive: true };
    if (req.query.durationType) filter.durationType = req.query.durationType;
    if (req.query.startFrom) filter.startFrom = req.query.startFrom;
    if (req.query.q) {
      filter.title = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    }
    const items = await Tour.find(filter)
      .populate("destinations", "name hamlet coverImage")
      .populate("business", "businessProfile phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const tour = await Tour.findById(req.params.id)
      .populate("destinations")
      .populate("business", "businessProfile phone email");
    if (!tour) throw new ApiError(404, "Không tìm thấy tour");
    res.json({ success: true, data: tour });
  })
);

router.post(
  "/",
  authenticate,
  authorize("business"),
  asyncHandler(async (req, res) => {
    const tour = await Tour.create({
      business: req.user._id,
      title: req.body.title,
      durationType: req.body.durationType,
      startFrom: req.body.startFrom,
      description: req.body.description,
      coverImage: req.body.coverImage,
      price: req.body.price,
      seats: req.body.seats,
      departureSchedule: req.body.departureSchedule,
      destinations: req.body.destinations || [],
      approvalStatus: "pending",
    });
    res.status(201).json({ success: true, data: tour });
  })
);

router.post(
  "/:id/book",
  authenticate,
  authorize("customer"),
  asyncHandler(async (req, res) => {
    const tour = await Tour.findById(req.params.id);
    if (!tour || tour.approvalStatus !== "approved") throw new ApiError(404, "Tour không khả dụng");
    const guests = Number(req.body.guests || 1);
    if (guests > tour.seats) throw new ApiError(400, "Không đủ chỗ");
    const booking = await TourBooking.create({
      customer: req.user._id,
      tour: tour._id,
      business: tour.business,
      date: req.body.date,
      guests,
      phone: req.body.phone || req.user.phone,
      total: tour.price * guests,
    });
    res.status(201).json({ success: true, data: booking });
  })
);

module.exports = router;
