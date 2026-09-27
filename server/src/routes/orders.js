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

async function updateBooking(Model, id, user, ownerField, next) {
  const allowed = ["cho_xac_nhan", "da_xac_nhan", "hoan_tat", "huy"];
  if (!allowed.includes(next)) throw new ApiError(400, "Trạng thái không hợp lệ");
  const booking = await Model.findById(id);
  if (!booking) throw new ApiError(404, "Không tìm thấy lịch đặt");
  if (user.role === "customer") {
    if (booking.customer.toString() !== user._id.toString()) throw new ApiError(403, "Không phải lịch của bạn");
    if (next !== "huy") throw new ApiError(400, "Bạn chỉ được hủy lịch của mình");
    if (booking.status === "hoan_tat") throw new ApiError(400, "Lịch đã hoàn tất, không hủy được");
    booking.status = "huy";
    await booking.save();
    return booking;
  }
  if (user.role !== "admin" && booking[ownerField].toString() !== user._id.toString()) {
    throw new ApiError(403, "Không thuộc đơn vị của bạn");
  }
  if (!["farmer", "business", "admin"].includes(user.role)) throw new ApiError(403, "Không đủ quyền");
  booking.status = next;
  await booking.save();
  return booking;
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
  asyncHandler(async (req, res) => {
    const booking = await updateBooking(ExperienceBooking, req.params.id, req.user, "farmer", req.body.status);
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
  asyncHandler(async (req, res) => {
    const booking = await updateBooking(TourBooking, req.params.id, req.user, "business", req.body.status);
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
  asyncHandler(async (req, res) => {
    const booking = await updateBooking(VehicleBooking, req.params.id, req.user, "business", req.body.status);
    res.json({ success: true, data: booking });
  })
);

module.exports = router;
