const express = require("express");
const Tour = require("../models/Tour");
const { TourBooking } = require("../models/Booking");
const { authenticate, authorize } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");
const { ACTIVE, durationMinutes, listDepartures } = require("../utils/schedule");
const { assertCustomerFree, assertTourSeats } = require("../utils/bookingGuard");

async function decorateTours(tours) {
  const list = Array.isArray(tours) ? tours : [tours];
  const bookings = await TourBooking.find({
    tour: { $in: list.map((tour) => tour._id) },
    status: { $in: ACTIVE },
    startAt: { $gte: new Date() },
  }).select("tour startAt guests");
  const decorated = list.map((tour) => {
    const obj = tour.toObject();
    obj.durationMinutes = durationMinutes(tour);
    obj.nextDepartures = listDepartures(tour, 28)
      .slice(0, 8)
      .map((slot) => {
        const taken = bookings
          .filter((row) => String(row.tour) === String(tour._id) && Math.abs(new Date(row.startAt) - slot.start) < 60000)
          .reduce((sum, row) => sum + (row.guests || 0), 0);
        return {
          startAt: slot.start,
          endAt: slot.end,
          label: slot.label,
          seatsLeft: Math.max(0, tour.seats - taken),
        };
      });
    return obj;
  });
  return Array.isArray(tours) ? decorated : decorated[0];
}

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
    res.json({ success: true, data: await decorateTours(items) });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const tour = await Tour.findById(req.params.id)
      .populate("destinations")
      .populate("business", "businessProfile phone email");
    if (!tour) throw new ApiError(404, "Không tìm thấy tour");
    res.json({ success: true, data: await decorateTours(tour) });
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
    if (!tour || tour.approvalStatus !== "approved" || !tour.isActive) throw new ApiError(404, "Tour không khả dụng");
    const start = new Date(req.body.date);
    if (Number.isNaN(start.getTime())) throw new ApiError(400, "Chọn giờ khởi hành");
    if (start.getTime() <= Date.now()) throw new ApiError(400, "Không đặt giờ đã qua. Hãy chọn giờ khác.");
    const slot = listDepartures(tour, 35).find((item) => Math.abs(item.start.getTime() - start.getTime()) < 60000);
    if (!slot) throw new ApiError(400, "Chuyến không có giờ này. Hãy chọn giờ trong lịch.");
    const guests = Number(req.body.guests || 1);
    if (!Number.isInteger(guests) || guests < 1) throw new ApiError(400, "Số khách không hợp lệ");
    const phone = String(req.body.phone || req.user.phone || "").trim();
    if (!phone) throw new ApiError(400, "Cần số điện thoại");
    await assertTourSeats(tour, slot.start, guests);
    await assertCustomerFree(req.user._id, slot.start, slot.end);
    const booking = await TourBooking.create({
      customer: req.user._id,
      tour: tour._id,
      business: tour.business,
      date: slot.start,
      startAt: slot.start,
      endAt: slot.end,
      guests,
      phone,
      total: tour.price * guests,
    });
    res.status(201).json({ success: true, data: booking });
  })
);

module.exports = router;
