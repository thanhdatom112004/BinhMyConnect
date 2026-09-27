const express = require("express");
const Product = require("../models/Product");
const Farm = require("../models/Farm");
const Tour = require("../models/Tour");
const News = require("../models/News");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

const searchHandler = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  const type = req.query.type;
  if (!q) return res.json({ success: true, data: { products: [], farms: [], tours: [] } });

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const want = (t) => !type || type === t;

  const [products, farms, tours] = await Promise.all([
    want("nong_san")
      ? Product.find({ approvalStatus: "approved", isActive: true, name: regex }).limit(12)
      : [],
    want("nong_trai")
      ? Farm.find({
          approvalStatus: "approved",
          isVisible: true,
          $or: [{ name: regex }, { hamlet: regex }, { tags: regex }],
        }).limit(12)
      : [],
    want("tour")
      ? Tour.find({ approvalStatus: "approved", isActive: true, title: regex }).limit(12)
      : [],
  ]);

  res.json({ success: true, data: { products, farms, tours } });
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const [featuredFarms, bestSellers, dayTours, latestNews] = await Promise.all([
      Farm.find({ approvalStatus: "approved", isVisible: true, featured: true })
        .populate("owner", "farmerProfile phone")
        .limit(6),
      Product.find({ approvalStatus: "approved", isActive: true })
        .populate("farm", "name hamlet")
        .populate("farmer", "farmerProfile")
        .sort({ soldCount: -1 })
        .limit(8),
      Tour.find({
        approvalStatus: "approved",
        isActive: true,
        durationType: "mot_ngay",
        startFrom: "tphcm",
      })
        .populate("destinations", "name hamlet")
        .limit(4),
      News.find({ approvalStatus: "approved" }).sort({ publishedAt: -1 }).limit(4),
    ]);

    res.json({
      success: true,
      data: {
        brand: {
          name: "Bình Mỹ Connect",
          location: "Xã Bình Mỹ, Củ Chi, TP.HCM",
          banner:
            "Mua nông sản sạch, đặt tour miệt vườn, xem tin Bình Mỹ — tất cả trên một nơi",
        },
        blocks: [
          { key: "nong_san", title: "Nông sản", href: "/shop.html" },
          { key: "trai_nghiem", title: "Điểm trải nghiệm", href: "/farms.html" },
          { key: "tour_xe", title: "Tour & xe", href: "/tours.html" },
          { key: "tin_tuc", title: "Tin tức", href: "/news.html" },
        ],
        featuredFarms,
        bestSellers,
        dayTours,
        latestNews,
      },
    });
  })
);

router.get("/search", searchHandler);
router.searchHandler = searchHandler;

module.exports = router;
