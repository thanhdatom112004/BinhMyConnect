const express = require("express");
const User = require("../models/User");
const { signToken } = require("../utils/jwt");
const { ApiError } = require("../utils/apiError");
const { asyncHandler } = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, role, phone } = req.body;
    if (!email || !password || !role) {
      throw new ApiError(400, "Thiếu email, mật khẩu hoặc vai trò");
    }
    if (!["customer", "farmer", "business"].includes(role)) {
      throw new ApiError(400, "Vai trò không hợp lệ");
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) throw new ApiError(409, "Email đã được đăng ký");

    const user = new User({ email, password, role, phone });
    if (role === "customer") {
      user.customerProfile = {
        fullName: req.body.fullName || "",
        area: req.body.area || "",
      };
    }
    if (role === "farmer") {
      user.farmerProfile = {
        householdName: req.body.householdName || "",
        hamlet: req.body.hamlet || "",
        gardenDescription: req.body.gardenDescription || "",
        photos: req.body.photos || [],
        mainProducts: req.body.mainProducts || [],
      };
    }
    if (role === "business") {
      user.businessProfile = {
        companyName: req.body.companyName || "",
        serviceTypes: req.body.serviceTypes || [],
      };
    }
    await user.save();
    const token = signToken(user);
    res.status(201).json({ success: true, token, user: user.toPublicJSON() });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, "Email hoặc mật khẩu không đúng");
    }
    const token = signToken(user);
    const safe = user.toPublicJSON();
    delete safe.password;
    res.json({ success: true, token, user: safe });
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ success: true, user: req.user.toPublicJSON() });
  })
);

router.put(
  "/profile",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = req.user;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.avatar) user.avatar = req.body.avatar;
    if (user.role === "customer") {
      user.customerProfile = {
        ...user.customerProfile,
        fullName: req.body.fullName ?? user.customerProfile?.fullName,
        area: req.body.area ?? user.customerProfile?.area,
      };
    }
    if (user.role === "farmer") {
      user.farmerProfile = {
        ...user.farmerProfile,
        householdName: req.body.householdName ?? user.farmerProfile?.householdName,
        hamlet: req.body.hamlet ?? user.farmerProfile?.hamlet,
        gardenDescription: req.body.gardenDescription ?? user.farmerProfile?.gardenDescription,
        photos: req.body.photos ?? user.farmerProfile?.photos,
        mainProducts: req.body.mainProducts ?? user.farmerProfile?.mainProducts,
      };
    }
    if (user.role === "business") {
      user.businessProfile = {
        ...user.businessProfile,
        companyName: req.body.companyName ?? user.businessProfile?.companyName,
        serviceTypes: req.body.serviceTypes ?? user.businessProfile?.serviceTypes,
      };
    }
    await user.save();
    res.json({ success: true, user: user.toPublicJSON() });
  })
);

module.exports = router;
