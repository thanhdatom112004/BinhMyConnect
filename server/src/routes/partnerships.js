const express = require("express");
const Partnership = require("../models/Partnership");
const Farm = require("../models/Farm");
const { authenticate, authorize } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");

const router = express.Router();

router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.user.role === "business") filter.business = req.user._id;
    else if (req.user.role === "farmer") filter.farmer = req.user._id;
    else if (req.user.role !== "admin") throw new ApiError(403, "Không xem đề nghị hợp tác");
    const items = await Partnership.find(filter)
      .populate("business", "businessProfile phone")
      .populate("farmer", "farmerProfile phone")
      .populate("farm", "name hamlet")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  })
);

router.post(
  "/",
  authenticate,
  authorize("business"),
  asyncHandler(async (req, res) => {
    const farm = await Farm.findById(req.body.farmId);
    if (!farm) throw new ApiError(404, "Không tìm thấy nông trại");
    const item = await Partnership.create({
      business: req.user._id,
      farmer: farm.owner,
      farm: farm._id,
      type: req.body.type,
      message: req.body.message,
    });
    res.status(201).json({ success: true, data: item });
  })
);

router.patch(
  "/:id",
  authenticate,
  authorize("farmer"),
  asyncHandler(async (req, res) => {
    const item = await Partnership.findOne({ _id: req.params.id, farmer: req.user._id });
    if (!item) throw new ApiError(404, "Không tìm thấy đề nghị");
    if (!["chap_nhan", "tu_choi"].includes(req.body.status)) {
      throw new ApiError(400, "Chỉ chấp nhận hoặc từ chối");
    }
    item.status = req.body.status;
    await item.save();
    res.json({ success: true, data: item });
  })
);

module.exports = router;
