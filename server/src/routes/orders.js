const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { ExperienceBooking, TourBooking, VehicleBooking } = require("../models/Booking");
const { authenticate, authorize } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");

const router = express.Router();

router.get(
  "/products",
  authenticate,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.user.role === "customer") filter.customer = req.user._id;
    else if (req.user.role === "farmer") filter.farmer = req.user._id;
    else if (req.user.role !== "admin") throw new ApiError(403, "Không xem được đơn hàng này");
    const items = await Order.find(filter)
      .populate("customer", "customerProfile phone email")
      .populate("farmer", "farmerProfile")
      .populate("items.product", "name images")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  })
);

router.patch(
  "/products/:id/status",
  authenticate,
  authorize("farmer", "admin"),
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError(404, "Không tìm thấy đơn");
    if (req.user.role === "farmer" && order.farmer.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Đơn không thuộc hộ của bạn");
    }
    const next = req.body.status;
    if (!["cho_xac_nhan", "dang_giao", "hoan_tat", "huy"].includes(next)) {
      throw new ApiError(400, "Trạng thái không hợp lệ");
    }
    if (next === "huy" && order.status !== "huy") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }
    if (next === "hoan_tat" && order.status !== "hoan_tat") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { soldCount: item.quantity } });
      }
    }
    order.status = next;
    await order.save();
    res.json({ success: true, data: order });
  })
);

function bookingFilter(user, customerField, ownerField) {
  if (user.role === "customer") return { [customerField]: user._id };
  if (user.role === "farmer" || user.role === "business") return { [ownerField]: user._id };
  if (user.role === "admin") return {};
  return { _id: null };
}

router.get(
  "/experiences",
  authenticate,
  asyncHandler(async (req, res) => {
    const filter = bookingFilter(req.user, "customer", "farmer");
    const items = await ExperienceBooking.find(filter)
      .populate("farm", "name hamlet")
      .populate("customer", "customerProfile phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  })
);

router.patch(
  "/experiences/:id/status",
  authenticate,
  authorize("farmer", "admin"),
  asyncHandler(async (req, res) => {
    const booking = await ExperienceBooking.findById(req.params.id);
    if (!booking) throw new ApiError(404, "Không tìm thấy đặt chỗ");
    if (req.user.role === "farmer" && booking.farmer.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Không thuộc hộ của bạn");
    }
    booking.status = req.body.status;
    await booking.save();
    res.json({ success: true, data: booking });
  })
);

router.get(
  "/tours",
  authenticate,
  asyncHandler(async (req, res) => {
    const filter = bookingFilter(req.user, "customer", "business");
    const items = await TourBooking.find(filter)
      .populate("tour", "title price")
      .populate("customer", "customerProfile phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  })
);

router.patch(
  "/tours/:id/status",
  authenticate,
  authorize("business", "admin"),
  asyncHandler(async (req, res) => {
    const booking = await TourBooking.findById(req.params.id);
    if (!booking) throw new ApiError(404, "Không tìm thấy đặt tour");
    if (req.user.role === "business" && booking.business.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Không thuộc đơn vị của bạn");
    }
    booking.status = req.body.status;
    await booking.save();
    res.json({ success: true, data: booking });
  })
);

router.get(
  "/vehicles",
  authenticate,
  asyncHandler(async (req, res) => {
    const filter = bookingFilter(req.user, "customer", "business");
    const items = await VehicleBooking.find(filter)
      .populate("vehicle", "name vehicleType")
      .populate("customer", "customerProfile phone")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  })
);

router.patch(
  "/vehicles/:id/status",
  authenticate,
  authorize("business", "admin"),
  asyncHandler(async (req, res) => {
    const booking = await VehicleBooking.findById(req.params.id);
    if (!booking) throw new ApiError(404, "Không tìm thấy đặt xe");
    if (req.user.role === "business" && booking.business.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Không thuộc đơn vị của bạn");
    }
    booking.status = req.body.status;
    await booking.save();
    res.json({ success: true, data: booking });
  })
);

module.exports = router;
