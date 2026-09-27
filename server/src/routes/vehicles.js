const express = require("express");
const Vehicle = require("../models/Vehicle");
const { VehicleBooking } = require("../models/Booking");
const { authenticate, authorize } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");
const { assertCustomerFree, assertVehicleFree } = require("../utils/bookingGuard");
const { parseVnInput } = require("../utils/schedule");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = { isActive: true };
    if (req.query.vehicleType) filter.vehicleType = req.query.vehicleType;
    const items = await Vehicle.find(filter).populate("business", "businessProfile phone");
    res.json({ success: true, data: items });
  })
);

router.post(
  "/",
  authenticate,
  authorize("business"),
  asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.create({
      business: req.user._id,
      name: req.body.name,
      vehicleType: req.body.vehicleType,
      description: req.body.description,
      image: req.body.image,
      price: req.body.price,
      priceUnit: req.body.priceUnit || "chuyến",
    });
    res.status(201).json({ success: true, data: vehicle });
  })
);

router.post(
  "/:id/book",
  authenticate,
  authorize("customer"),
  asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle || !vehicle.isActive) throw new ApiError(404, "Xe không khả dụng");
    const start = parseVnInput(req.body.pickupTime);
    if (!start) throw new ApiError(400, "Chọn giờ đón");
    if (start.getTime() <= Date.now()) throw new ApiError(400, "Không đặt giờ đã qua. Hãy chọn giờ khác.");
    const guests = Number(req.body.guests || 1);
    const seats = vehicle.seats || 4;
    if (!Number.isInteger(guests) || guests < 1 || guests > seats) {
      throw new ApiError(400, `Xe này chở tối đa ${seats} khách`);
    }
    const pickupPoint = String(req.body.pickupPoint || "").trim();
    const dropoffPoint = String(req.body.dropoffPoint || "").trim();
    if (!pickupPoint || !dropoffPoint) throw new ApiError(400, "Nhập điểm đón và điểm trả");
    const phone = String(req.body.phone || req.user.phone || "").trim();
    if (!phone) throw new ApiError(400, "Cần số điện thoại");
    const end = new Date(start.getTime() + (vehicle.durationMinutes || 180) * 60000);
    await assertVehicleFree(vehicle._id, start, end);
    await assertCustomerFree(req.user._id, start, end);
    const booking = await VehicleBooking.create({
      customer: req.user._id,
      vehicle: vehicle._id,
      business: vehicle.business,
      pickupPoint,
      dropoffPoint,
      pickupTime: start,
      startAt: start,
      endAt: end,
      guests,
      phone,
      total: vehicle.price,
    });
    res.status(201).json({ success: true, data: booking });
  })
);

module.exports = router;
