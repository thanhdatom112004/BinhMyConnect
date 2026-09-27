const express = require("express");
const Farm = require("../models/Farm");
const Product = require("../models/Product");
const Tour = require("../models/Tour");
const { ExperienceBooking } = require("../models/Booking");
const { authenticate, authorize } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");
const { combineDateTime, assertWithinOpenHours } = require("../utils/schedule");
const { assertCustomerFree } = require("../utils/bookingGuard");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { tag, hamlet, q } = req.query;
    const filter = { approvalStatus: "approved", isVisible: true };
    if (tag) filter.tags = tag;
    if (hamlet) filter.hamlet = hamlet;
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: regex }, { hamlet: regex }, { tags: regex }];
    }
    const items = await Farm.find(filter)
      .populate("owner", "farmerProfile phone")
      .sort({ featured: -1, avgRating: -1 });
    res.json({ success: true, data: items });
  })
);

router.get(
  "/mine",
  authenticate,
  authorize("farmer"),
  asyncHandler(async (req, res) => {
    const farms = await Farm.find({ owner: req.user._id });
    res.json({ success: true, data: farms });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const farm = await Farm.findById(req.params.id).populate("owner", "farmerProfile phone email");
    if (!farm) throw new ApiError(404, "Không tìm thấy nông trại");
    const [products, tours] = await Promise.all([
      Product.find({ farm: farm._id, approvalStatus: "approved", isActive: true }),
      Tour.find({ destinations: farm._id, approvalStatus: "approved", isActive: true }),
    ]);
    res.json({ success: true, data: { farm, products, tours } });
  })
);

router.post(
  "/",
  authenticate,
  authorize("farmer"),
  asyncHandler(async (req, res) => {
    const farm = await Farm.create({
      owner: req.user._id,
      name: req.body.name,
      coverImage: req.body.coverImage,
      hamlet: req.body.hamlet,
      address: req.body.address,
      intro: req.body.intro,
      openHours: req.body.openHours,
      mapDirections: req.body.mapDirections,
      gallery: req.body.gallery || [],
      tags: req.body.tags || [],
      onSiteServices: req.body.onSiteServices || [],
      isOpenForVisitors: !!req.body.isOpenForVisitors,
      isVisible: req.body.isVisible !== false,
      approvalStatus: "pending",
    });
    res.status(201).json({ success: true, data: farm });
  })
);

router.put(
  "/:id",
  authenticate,
  authorize("farmer"),
  asyncHandler(async (req, res) => {
    const farm = await Farm.findOne({ _id: req.params.id, owner: req.user._id });
    if (!farm) throw new ApiError(404, "Không tìm thấy trang vườn của bạn");
    const fields = [
      "name",
      "coverImage",
      "hamlet",
      "address",
      "intro",
      "openHours",
      "mapDirections",
      "gallery",
      "tags",
      "onSiteServices",
      "isOpenForVisitors",
      "isVisible",
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) farm[f] = req.body[f];
    });
    farm.approvalStatus = "pending";
    await farm.save();
    res.json({ success: true, data: farm });
  })
);

router.post(
  "/:id/packages",
  authenticate,
  authorize("farmer"),
  asyncHandler(async (req, res) => {
    const farm = await Farm.findOne({ _id: req.params.id, owner: req.user._id });
    if (!farm) throw new ApiError(404, "Không tìm thấy trang vườn của bạn");
    farm.packages.push({
      name: req.body.name,
      price: req.body.price,
      maxGuests: req.body.maxGuests,
      durationMinutes: req.body.durationMinutes,
      description: req.body.description,
      isActive: req.body.isActive !== false,
    });
    await farm.save();
    res.status(201).json({ success: true, data: farm });
  })
);

router.post(
  "/:id/book",
  authenticate,
  authorize("customer"),
  asyncHandler(async (req, res) => {
    const farm = await Farm.findById(req.params.id);
    if (!farm || farm.approvalStatus !== "approved") throw new ApiError(404, "Nông trại chưa mở");
    if (!farm.isOpenForVisitors || !farm.isVisible) {
      throw new ApiError(400, "Vườn chưa sẵn sàng đón khách");
    }
    const pkg = farm.packages.id(req.body.packageId);
    if (!pkg || !pkg.isActive) throw new ApiError(400, "Gói trải nghiệm không hợp lệ");
    const guests = Number(req.body.guests || 1);
    if (!Number.isInteger(guests) || guests < 1 || guests > pkg.maxGuests) {
      throw new ApiError(400, `Gói này tối đa ${pkg.maxGuests} khách`);
    }
    const start = combineDateTime(req.body.date, req.body.time);
    if (!start) throw new ApiError(400, "Chọn ngày và giờ đến");
    if (start.getTime() <= Date.now()) throw new ApiError(400, "Không đặt giờ đã qua. Hãy đặt giờ khác.");
    const end = new Date(start.getTime() + (pkg.durationMinutes || 60) * 60000);
    try {
      assertWithinOpenHours(farm.openHours, start, end);
    } catch (err) {
      throw new ApiError(400, err.message);
    }
    const phone = String(req.body.phone || req.user.phone || "").trim();
    if (!phone) throw new ApiError(400, "Cần số điện thoại");
    await assertCustomerFree(req.user._id, start, end);
    const booking = await ExperienceBooking.create({
      customer: req.user._id,
      farm: farm._id,
      farmer: farm.owner,
      packageId: pkg._id,
      packageName: pkg.name,
      date: start,
      startAt: start,
      endAt: end,
      guests,
      phone,
      total: pkg.price * guests,
    });
    res.status(201).json({ success: true, data: booking });
  })
);

module.exports = router;
