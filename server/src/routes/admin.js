const express = require("express");
const Product = require("../models/Product");
const Farm = require("../models/Farm");
const News = require("../models/News");
const Tour = require("../models/Tour");
const Order = require("../models/Order");
const { ExperienceBooking, TourBooking, VehicleBooking } = require("../models/Booking");
const { authenticate, authorize } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");

const router = express.Router();
router.use(authenticate, authorize("admin"));

async function moderate(Model, id, status, extra = {}) {
  if (!["approved", "rejected"].includes(status)) throw new ApiError(400, "Trạng thái duyệt không hợp lệ");
  const doc = await Model.findByIdAndUpdate(id, { approvalStatus: status, ...extra }, { new: true });
  if (!doc) throw new ApiError(404, "Không tìm thấy mục cần duyệt");
  return doc;
}

router.get(
  "/pending",
  asyncHandler(async (req, res) => {
    const [products, farms, news, tours] = await Promise.all([
      Product.find({ approvalStatus: "pending" }).populate("farmer", "farmerProfile"),
      Farm.find({ approvalStatus: "pending" }).populate("owner", "farmerProfile"),
      News.find({ approvalStatus: "pending" }).populate("author", "farmerProfile"),
      Tour.find({ approvalStatus: "pending" }).populate("business", "businessProfile"),
    ]);
    res.json({ success: true, data: { products, farms, news, tours } });
  })
);

router.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const [productOrders, experiences, tours, vehicles] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).limit(50),
      ExperienceBooking.find().sort({ createdAt: -1 }).limit(50),
      TourBooking.find().sort({ createdAt: -1 }).limit(50),
      VehicleBooking.find().sort({ createdAt: -1 }).limit(50),
    ]);
    res.json({ success: true, data: { productOrders, experiences, tours, vehicles } });
  })
);

router.patch(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const data = await moderate(Product, req.params.id, req.body.status);
    res.json({ success: true, data });
  })
);

router.patch(
  "/farms/:id",
  asyncHandler(async (req, res) => {
    const data = await moderate(Farm, req.params.id, req.body.status);
    res.json({ success: true, data });
  })
);

router.patch(
  "/news/:id",
  asyncHandler(async (req, res) => {
    const extra = req.body.status === "approved" ? { publishedAt: new Date() } : {};
    const data = await moderate(News, req.params.id, req.body.status, extra);
    res.json({ success: true, data });
  })
);

router.patch(
  "/tours/:id",
  asyncHandler(async (req, res) => {
    const data = await moderate(Tour, req.params.id, req.body.status);
    res.json({ success: true, data });
  })
);

module.exports = router;
