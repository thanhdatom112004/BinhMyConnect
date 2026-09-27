const express = require("express");
const Vehicle = require("../models/Vehicle");
const { VehicleBooking } = require("../models/Booking");
const { authenticate, authorize } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");

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
    const booking = await VehicleBooking.create({
      customer: req.user._id,
      vehicle: vehicle._id,
      business: vehicle.business,
      pickupPoint: req.body.pickupPoint,
      dropoffPoint: req.body.dropoffPoint,
      pickupTime: req.body.pickupTime,
      guests: req.body.guests,
      phone: req.body.phone || req.user.phone,
      total: vehicle.price,
    });
    res.status(201).json({ success: true, data: booking });
  })
);

module.exports = router;
