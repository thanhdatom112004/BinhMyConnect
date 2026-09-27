const express = require("express");
const News = require("../models/News");
const { authenticate, authorize } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiError");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = { approvalStatus: "approved" };
    if (req.query.category) filter.category = req.query.category;
    const items = await News.find(filter)
      .populate("author", "role farmerProfile customerProfile")
      .sort({ publishedAt: -1, createdAt: -1 });
    res.json({ success: true, data: items });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const item = await News.findById(req.params.id).populate("author", "role farmerProfile");
    if (!item || item.approvalStatus !== "approved") throw new ApiError(404, "Bài viết chưa được duyệt");
    res.json({ success: true, data: item });
  })
);

router.post(
  "/",
  authenticate,
  authorize("admin", "farmer"),
  asyncHandler(async (req, res) => {
    const isAdmin = req.user.role === "admin";
    const news = await News.create({
      author: req.user._id,
      title: req.body.title,
      category: req.body.category,
      coverImage: req.body.coverImage,
      content: req.body.content,
      approvalStatus: isAdmin ? "approved" : "pending",
      publishedAt: isAdmin ? new Date() : undefined,
    });
    res.status(201).json({ success: true, data: news });
  })
);

module.exports = router;
