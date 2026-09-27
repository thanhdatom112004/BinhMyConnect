const express = require("express");
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Farm = require("../models/Farm");
const Tour = require("../models/Tour");
const Vehicle = require("../models/Vehicle");
const Order = require("../models/Order");
const { ExperienceBooking, TourBooking, VehicleBooking } = require("../models/Booking");
const { authenticate, authorize } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");
const { setTargetRating } = require("../utils/ratings");

const router = express.Router();

const models = {
  product: Product,
  farm: Farm,
  tour: Tour,
  vehicle: Vehicle,
};

async function assertEligible(userId, targetType, targetId) {
  if (targetType === "product") {
    const ok = await Order.exists({
      customer: userId,
      status: "hoan_tat",
      "items.product": targetId,
    });
    if (!ok) throw new ApiError(403, "Chỉ đánh giá sau khi đơn nông sản hoàn tất");
  }
  if (targetType === "farm") {
    const ok =
      (await ExperienceBooking.exists({
        customer: userId,
        farm: targetId,
        status: "hoan_tat",
      })) ||
      (await Order.exists({ customer: userId, farm: targetId, status: "hoan_tat" }));
    if (!ok) throw new ApiError(403, "Chỉ đánh giá sau khi đã mua hoặc đã trải nghiệm tại vườn");
  }
  if (targetType === "tour") {
    const ok = await TourBooking.exists({
      customer: userId,
      tour: targetId,
      status: "hoan_tat",
    });
    if (!ok) throw new ApiError(403, "Chỉ đánh giá sau khi hoàn tất tour");
  }
  if (targetType === "vehicle") {
    const ok = await VehicleBooking.exists({
      customer: userId,
      vehicle: targetId,
      status: "hoan_tat",
    });
    if (!ok) throw new ApiError(403, "Chỉ đánh giá sau khi hoàn tất chuyến xe");
  }
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { targetType, targetId } = req.query;
    const filter = {};
    if (targetType) filter.targetType = targetType;
    if (targetId) filter.targetId = targetId;
    const items = await Review.find(filter)
      .populate("author", "customerProfile avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  })
);

router.get(
  "/top/farms",
  asyncHandler(async (req, res) => {
    const items = await Farm.find({
      approvalStatus: "approved",
      isVisible: true,
      reviewCount: { $gte: 1 },
    })
      .sort({ avgRating: -1, reviewCount: -1 })
      .limit(10);
    res.json({ success: true, data: items });
  })
);

router.get(
  "/top/products",
  asyncHandler(async (req, res) => {
    const items = await Product.find({
      approvalStatus: "approved",
      isActive: true,
      reviewCount: { $gte: 1 },
    })
      .populate("farm", "name hamlet")
      .sort({ avgRating: -1, reviewCount: -1 })
      .limit(10);
    res.json({ success: true, data: items });
  })
);

router.post(
  "/",
  authenticate,
  authorize("customer"),
  asyncHandler(async (req, res) => {
    const { targetType, targetId, rating, comment } = req.body;
    if (!models[targetType]) throw new ApiError(400, "Loại đánh giá không hợp lệ");
    if (!mongoose.isValidObjectId(targetId)) throw new ApiError(400, "Đối tượng không hợp lệ");
    await assertEligible(req.user._id, targetType, targetId);
    const review = await Review.create({
      author: req.user._id,
      targetType,
      targetId,
      rating,
      comment,
      verifiedPurchase: true,
    });
    await setTargetRating(targetType, review.targetId, models[targetType]);
    res.status(201).json({ success: true, data: review });
  })
);

module.exports = router;
