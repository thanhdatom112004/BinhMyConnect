const express = require("express");
const Product = require("../models/Product");
const Farm = require("../models/Farm");
const { authenticate, authorize } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { category, farm, minPrice, maxPrice, q, sort } = req.query;
    const filter = { approvalStatus: "approved", isActive: true };
    if (category) filter.category = category;
    if (farm) filter.farm = farm;
    if (q) filter.name = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    let query = Product.find(filter)
      .populate("farm", "name hamlet avgRating")
      .populate("farmer", "farmerProfile phone");
    if (sort === "price_asc") query = query.sort({ price: 1 });
    else if (sort === "price_desc") query = query.sort({ price: -1 });
    else if (sort === "rating") query = query.sort({ avgRating: -1 });
    else query = query.sort({ soldCount: -1, createdAt: -1 });
    const items = await query;
    res.json({ success: true, data: items });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const item = await Product.findById(req.params.id)
      .populate("farm", "name hamlet address owner avgRating tags")
      .populate("farmer", "farmerProfile phone email");
    if (!item) throw new ApiError(404, "Không tìm thấy sản phẩm");
    res.json({ success: true, data: item });
  })
);

router.post(
  "/",
  authenticate,
  authorize("farmer"),
  asyncHandler(async (req, res) => {
    const farm = await Farm.findOne({ _id: req.body.farm, owner: req.user._id });
    if (!farm) throw new ApiError(400, "Vườn không thuộc hộ của bạn");
    const product = await Product.create({
      farmer: req.user._id,
      farm: farm._id,
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      images: req.body.images || [],
      price: req.body.price,
      unit: req.body.unit || "kg",
      stock: req.body.stock || 0,
      originNote: req.body.originNote || `Xuất xứ: ${farm.name}`,
      approvalStatus: "pending",
    });
    res.status(201).json({ success: true, data: product });
  })
);

router.put(
  "/:id",
  authenticate,
  authorize("farmer"),
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, farmer: req.user._id });
    if (!product) throw new ApiError(404, "Không tìm thấy sản phẩm của hộ");
    const fields = ["name", "category", "description", "images", "price", "unit", "stock", "originNote", "isActive"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) product[f] = req.body[f];
    });
    product.approvalStatus = "pending";
    await product.save();
    res.json({ success: true, data: product });
  })
);

module.exports = router;
